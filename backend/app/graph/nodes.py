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
from app.graph.response_locale import detect_visitor_language, extract_visitor_question, harmonize_response_language
from app.graph.skill_focus import focus_skill_names, focus_summary, summary_mentions_any
from app.graph.suggested_actions import ensure_suggested_actions
from app.graph.widget_evidence import widgets_for_selection
from app.ai.gemini_client import gemini_api_keys
from app.llm.provider import Completion, GenAIChatModel, acomplete, get_chat_model
from app.observability.tracing import trace_node
from app.prompts.system import COMPOSER_COPY_PROMPT, ROUTER_PROMPT
from app.schemas.agent_response import AgentResponse, ComposerCopy
from app.tools import __all__ as TOOL_NAMES
from app.utils.json_loader import load_visible_items

TOOL_MAP = {name: getattr(tools_module, name) for name in TOOL_NAMES}
logger = logging.getLogger(__name__)
_ROUTER_GUIDE = """
Choose the route and the tool names. Do not answer the visitor and do not include portfolio JSON.
Dates, roles, skills, contact and project lists are facts: leave retrieval_query empty.
Questions about databases, SQL, ORMs, data platforms or data tools use get_skills.
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
    keys = gemini_api_keys()
    chat_model = get_chat_model(keys[0]) if keys else GenAIChatModel()
    router_attempt_timeouts: list[float] | None = None
    if len(keys) > 1:
        router_attempt_timeouts = [
            settings.LLM_TIMEOUT_ROUTER_FIRST_S,
            settings.LLM_TIMEOUT_ROUTER_S,
        ]
    completion = await acomplete(
        chat_model,
        messages,
        mode="structured",
        timeout=settings.LLM_TIMEOUT_ROUTER_S,
        schema=RouterDecision,
        call_site="router",
        attempt_timeouts=router_attempt_timeouts,
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


def _brief_item(item: dict[str, Any]) -> str:
    for key in ("name", "title", "role", "institution", "company"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()[:80]
    return ""


def _skills_by_category(raw: Any) -> dict[str, list[str]]:
    if isinstance(raw, dict) and isinstance(raw.get("categories"), dict):
        grouped: dict[str, list[str]] = {}
        for key, values in raw["categories"].items():
            if isinstance(values, list):
                grouped[str(key)] = [name for name in values if isinstance(name, str)]
        return grouped
    grouped = {}
    if isinstance(raw, list):
        for item in raw:
            if not isinstance(item, dict) or not isinstance(item.get("name"), str):
                continue
            category = str(item.get("category") or "other")
            grouped.setdefault(category, []).append(item["name"])
    return grouped


def _evidence_brief(tools: dict[str, Any]) -> dict[str, Any]:
    """Nombres reales para el compositor. El orden del catálogo no es relevancia."""

    brief: dict[str, Any] = {}
    for name, raw in tools.items():
        if name == "get_skills" or (isinstance(raw, dict) and "categories" in raw):
            by_category = _skills_by_category(raw)
            if by_category:
                brief[name] = {"by_category": by_category}
                continue
        if isinstance(raw, list):
            names = [_brief_item(item) if isinstance(item, dict) else "" for item in raw]
            names = [item for item in names if item]
            brief[name] = {"count": len(raw), "names": names[:80]}
        elif isinstance(raw, dict):
            brief[name] = {"fields": sorted(str(key) for key in list(raw)[:12])}
        else:
            brief[name] = {"present": raw is not None}
    return brief


async def _compose(
    question: str,
    pack: dict[str, Any],
    passages: list[Any],
    *,
    repair: bool,
    call_site: str,
    focus_names: list[str] | None = None,
) -> tuple[ComposerCopy | None, dict[str, Any]]:
    tools_evidence = pack.get("tools") if isinstance(pack.get("tools"), dict) else {}
    visitor_line = extract_visitor_question(question)
    expected_language = detect_visitor_language(visitor_line) if visitor_line else "es"
    brief = _evidence_brief(tools_evidence if isinstance(tools_evidence, dict) else {})
    if focus_names:
        brief["get_skills"] = {"names": focus_names}
    payload: dict[str, Any] = {
        "question": question,
        "evidence_brief": brief,
        "passage_count": len(passages),
        "tools_executed": list(tools_evidence) if isinstance(tools_evidence, dict) else [],
        "expected_language": expected_language,
    }
    if focus_names:
        payload["required_focus"] = {
            "names": focus_names,
            "rule": "Answer only about these names. Do not mention other skills.",
        }
    if repair:
        payload["repair"] = "The previous copy was empty or invalid. Answer again from the brief only."
    keys = gemini_api_keys()
    chat_model = get_chat_model(keys[0]) if keys else GenAIChatModel()
    composer_attempt_timeouts: list[float] | None = None
    if len(keys) > 1:
        composer_attempt_timeouts = [
            settings.LLM_TIMEOUT_COMPOSER_FIRST_S,
            settings.LLM_TIMEOUT_COMPOSER_S,
        ]
    completion = await acomplete(
        chat_model,
        [
            SystemMessage(content=COMPOSER_COPY_PROMPT),
            HumanMessage(content=json.dumps(payload, ensure_ascii=False)),
        ],
        mode="structured",
        timeout=settings.LLM_TIMEOUT_COMPOSER_S,
        schema=ComposerCopy,
        call_site=call_site,
        attempt_timeouts=composer_attempt_timeouts,
    )
    parsed = completion.parsed if isinstance(completion.parsed, ComposerCopy) else None
    if parsed is not None and not parsed.title.strip():
        parsed = None
    return parsed, _metric(completion)


@trace_node("compositor")
async def compositor(state: PortfolioState, config: RunnableConfig) -> dict[str, Any]:
    decision = _plan(state)
    pack = state.get("facts") or {}
    passages = list(state.get("passages") or [])
    tools_pack = pack.get("tools") if isinstance(pack, dict) else {}
    tools_dict = tools_pack if isinstance(tools_pack, dict) else {}
    visitor_line = extract_visitor_question(state["question"])
    focus_names = focus_skill_names(visitor_line, tools_dict.get("get_skills"))
    await _emit(config, {"type": "status", "phase": "synthesizing"})
    copy, first = await _compose(
        state["question"],
        pack,
        passages,
        repair=False,
        call_site="compositor",
        focus_names=focus_names,
    )
    metrics = [first]
    if copy is None:
        copy, second = await _compose(
            state["question"],
            pack,
            passages,
            repair=True,
            call_site="compositor-repair",
            focus_names=focus_names,
        )
        metrics.append(second)
    if copy is None:
        parsed = _insufficient(decision.language)
    else:
        widgets = widgets_for_selection(
            tools_dict,
            passages=passages,
            widget_types=list(copy.widget_types),
            project_groups=list(copy.project_groups),
            skill_categories=list(copy.skill_categories),
            skill_names=list(copy.skill_names),
            cv_download=copy.cv_download,
        )
        parsed = AgentResponse(
            language=copy.language,
            title=copy.title,
            summary=copy.summary,
            widgets=widgets,
            suggested_actions=copy.suggested_actions,
        )
        if focus_names:
            parsed = parsed.model_copy(
                update={
                    "widgets": widgets_for_selection(
                        tools_dict,
                        passages=passages,
                        widget_types=["skills"],
                        skill_names=focus_names,
                    ),
                    "summary": parsed.summary
                    if summary_mentions_any(parsed.summary, focus_names)
                    else focus_summary(parsed.language, focus_names),
                }
            )
    if parsed is not None:
        visitor = (state.get("visitor_question") or "").strip()
        parsed = harmonize_response_language(
            parsed,
            visitor_question=visitor,
            question_prompt=state["question"],
            router_language=decision.language,
        )
        parsed = ensure_suggested_actions(parsed, question_prompt=state["question"])
    result: dict[str, Any] = {
        "response": parsed.model_dump(),
        "attempts": len(metrics),
        "metrics": metrics,
    }
    visitor = (state.get("visitor_question") or "").strip()
    if visitor:
        result["session_questions"] = [visitor]
    return result
