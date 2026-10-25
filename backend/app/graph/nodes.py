"""Nodos del grafo. Solo el router y el compositor llaman al modelo."""

from __future__ import annotations

import asyncio
import json
import logging
from functools import lru_cache
from typing import Any

from langchain_core.callbacks import adispatch_custom_event
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

import app.tools as tools_module
from app.core.config import settings
from app.graph.decision import RouterDecision
from app.graph.state import PortfolioState
from app.llm.provider import Completion, acomplete, get_chat_model
from app.observability.tracing import trace_node
from app.prompts.system import COMPOSER_PROMPT, ROUTER_PROMPT
from app.schemas.agent_response import AgentResponse
from app.tools import __all__ as TOOL_NAMES
from app.utils.json_loader import load_visible_items

TOOL_MAP = {name: getattr(tools_module, name) for name in TOOL_NAMES}
logger = logging.getLogger(__name__)
_ROUTER_GUIDE = """
Choose the route and the tool names. Do not answer the visitor and do not include portfolio JSON.
Dates, roles, skills, contact and project lists are facts: leave retrieval_query empty.
Use narrative or both only when the visitor asks how or why something was built beyond the JSON record.
A question about a project still needs get_projects when the route is narrative or both.
retrieval_query is the visitor question when the route is narrative or both, otherwise an empty string.
Available tool names: {tools}
""".strip()


def _metric(completion: Completion, tools: list[str] | None = None) -> dict[str, Any]:
    return {
        "latency_ms": round(completion.latency_ms, 1),
        "prompt_tokens": completion.prompt_tokens,
        "output_tokens": completion.output_tokens,
        "total_tokens": completion.total_tokens,
        "tools": tools or [],
    }


async def _emit(config: RunnableConfig, event: dict[str, Any]) -> None:
    await adispatch_custom_event("portfolio", event, config=config)


def _plan(state: PortfolioState) -> RouterDecision:
    raw = state.get("plan") or {}
    if isinstance(raw, dict) and raw:
        return RouterDecision.model_validate(raw)
    return RouterDecision(route="direct", tools=[], language="es", retrieval_query="")


@lru_cache(maxsize=1)
def _catalog_ids() -> frozenset[str]:
    return frozenset(
        item["id"]
        for item in load_visible_items("projects.json")
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    )


def _cited_project_ids(response: AgentResponse) -> set[str]:
    catalog = _catalog_ids()
    found: set[str] = set()
    for widget in response.widgets:
        if widget.id in catalog:
            found.add(widget.id)
        for item in widget.data.get("items") or []:
            if isinstance(item, dict) and item.get("id") in catalog:
                found.add(item["id"])
    return found


def _project_ids(facts: dict[str, Any]) -> list[str]:
    projects = facts.get("get_projects")
    if not isinstance(projects, list):
        return []
    return [item["id"] for item in projects if isinstance(item, dict) and isinstance(item.get("id"), str)]


def _ids_allowed(response: AgentResponse, pack: dict[str, Any]) -> bool:
    allowed = set(pack.get("project_ids") or [])
    return _cited_project_ids(response) <= allowed


def _insufficient(language: str) -> AgentResponse:
    if language == "en":
        return AgentResponse(
            language="en",
            title="Not enough information",
            summary="I don't have enough information in the portfolio to answer that.",
            widgets=[],
            suggested_actions=[],
        )
    return AgentResponse(
        language="es",
        title="Información insuficiente",
        summary="No tengo suficiente información en el portfolio para responder eso.",
        widgets=[],
        suggested_actions=[],
    )


@trace_node("router")
async def router(state: PortfolioState, config: RunnableConfig) -> dict[str, Any]:
    await _emit(config, {"type": "status", "phase": "thinking"})
    messages = [
        SystemMessage(content=ROUTER_PROMPT + "\n\n" + _ROUTER_GUIDE.format(tools=", ".join(TOOL_NAMES))),
        HumanMessage(content=state["question"]),
    ]
    completion = await acomplete(
        get_chat_model(),
        messages,
        mode="structured",
        timeout=settings.LLM_TIMEOUT_ROUTER_S,
        schema=RouterDecision,
    )
    decision = completion.parsed if isinstance(completion.parsed, RouterDecision) else None
    if decision is None and completion.text:
        try:
            decision = RouterDecision.model_validate_json(completion.text)
        except ValueError:
            decision = None
    if decision is None:
        decision = RouterDecision(route="direct", tools=[], language="es", retrieval_query="")
    decision.tools = [name for name in decision.tools if name in TOOL_MAP]
    if decision.route == "direct":
        decision.tools = []
    return {"plan": decision.model_dump(), "metrics": [_metric(completion)]}


async def _run_tool(name: str, config: RunnableConfig) -> tuple[str, Any]:
    await _emit(config, {"type": "tool_call", "tool": name})
    try:
        result = await asyncio.to_thread(TOOL_MAP[name])
    except Exception as error:  # noqa: BLE001 — el paquete muestra el fallo, no lo inventa
        result = {"error": str(error)}
    await _emit(config, {"type": "tool_done", "tool": name})
    return name, result


@trace_node("bibliotecario")
async def bibliotecario(state: PortfolioState, config: RunnableConfig) -> dict[str, Any]:
    decision = _plan(state)
    names = [] if decision.route == "direct" else decision.tools
    pairs = await asyncio.gather(*[_run_tool(name, config) for name in names]) if names else []
    update: dict[str, Any] = {"facts": {name: result for name, result in pairs}}
    if names:
        update["metrics"] = [
            {
                "latency_ms": 0.0,
                "prompt_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "tools": list(names),
            }
        ]
    return update


@trace_node("investigador")
async def investigador(state: PortfolioState, config: RunnableConfig) -> dict[str, Any]:
    """Lee el corpus markdown solo en narrative o both. Los hechos no embeddean."""

    from app.rag.hybrid import indice

    decision = _plan(state)
    if decision.route not in {"narrative", "both"} or not indice.rag_ready:
        return {"passages": []}
    query = decision.retrieval_query.strip() or state["question"]
    try:
        passages = await asyncio.to_thread(indice.buscar, query)
    except Exception:
        logger.exception("La búsqueda del corpus falló")
        return {"passages": []}
    await _emit(config, {"type": "retrieval", "count": len(passages)})
    return {
        "passages": passages,
        "metrics": [
            {
                "latency_ms": 0.0,
                "prompt_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "tools": [],
                "embedding_tokens": indice.query_embedding_tokens,
                "embedding_latency_ms": round(indice.query_embedding_latency_ms, 1),
            }
        ],
    }


@trace_node("evidencia")
def evidencia(state: PortfolioState) -> dict[str, Any]:
    """Arma el paquete que ve el compositor. No llama al modelo."""

    tools = state.get("facts") or {}
    if isinstance(tools, dict) and "tools" in tools and "project_ids" in tools:
        tools = tools["tools"]
    return {
        "facts": {"tools": tools, "project_ids": _project_ids(tools if isinstance(tools, dict) else {})},
        "passages": list(state.get("passages") or []),
    }


async def _compose(
    question: str,
    pack: dict[str, Any],
    passages: list[Any],
    *,
    repair: bool,
) -> tuple[AgentResponse | None, dict[str, Any]]:
    payload: dict[str, Any] = {
        "question": question,
        "evidence": pack.get("tools") or {},
        "passages": passages,
        "allowed_project_ids": pack.get("project_ids") or [],
    }
    if repair:
        payload["repair"] = (
            "The previous answer was invalid or cited a project id outside allowed_project_ids. "
            "Answer again using only the evidence."
        )
    completion = await acomplete(
        get_chat_model(),
        [
            SystemMessage(content=COMPOSER_PROMPT),
            HumanMessage(content=json.dumps(payload, ensure_ascii=False, default=str)),
        ],
        mode="structured",
        timeout=settings.LLM_TIMEOUT_COMPOSER_S,
        schema=AgentResponse,
    )
    parsed = completion.parsed if isinstance(completion.parsed, AgentResponse) else None
    if parsed is not None and not _ids_allowed(parsed, pack):
        parsed = None
    return parsed, _metric(completion)


@trace_node("compositor")
async def compositor(state: PortfolioState, config: RunnableConfig) -> dict[str, Any]:
    await _emit(config, {"type": "status", "phase": "synthesizing"})
    decision = _plan(state)
    pack = state.get("facts") or {}
    passages = list(state.get("passages") or [])
    parsed, first = await _compose(state["question"], pack, passages, repair=False)
    metrics = [first]
    if parsed is None:
        parsed, second = await _compose(state["question"], pack, passages, repair=True)
        metrics.append(second)
    if parsed is None:
        parsed = _insufficient(decision.language)
    result: dict[str, Any] = {
        "response": parsed.model_dump(),
        "attempts": len(metrics),
        "metrics": metrics,
    }
    visitor = (state.get("visitor_question") or "").strip()
    if visitor:
        result["session_questions"] = [visitor]
    return result
