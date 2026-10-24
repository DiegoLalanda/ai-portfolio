"""El grafo de nodos cumple el golden set sin llamar a Gemini."""

import asyncio

from langchain_core.messages import AIMessage
from langgraph.checkpoint.memory import MemorySaver

from app.graph.builder import build_portfolio_graph
from app.graph.decision import RouterDecision
from app.prompts.system import COMPOSER_PROMPT, ROUTER_PROMPT, SYSTEM_PROMPT
from app.schemas.agent_response import AgentResponse
from app.services.chat_stream import stream_chat_events
from tests.test_golden_set import load_questions

_ROW: dict = {}
_COMPOSER_CALLS = {"n": 0}
_BAD_FIRST = {"on": False}


class _NodeModel:
    def __init__(self) -> None:
        self.schema = None

    def with_structured_output(self, schema, **_kwargs):
        self.schema = schema
        return self

    async def ainvoke(self, _messages):
        usage = {"input_tokens": 4, "output_tokens": 2, "total_tokens": 6}
        raw = AIMessage(content="{}", usage_metadata=usage)
        if self.schema is RouterDecision:
            parsed = RouterDecision(
                route="facts" if _ROW["expected_tools"] else "direct",
                tools=list(_ROW["expected_tools"]),
                language=_ROW["language"],
                retrieval_query="",
            )
            return {"raw": raw, "parsed": parsed}
        _COMPOSER_CALLS["n"] += 1
        if _BAD_FIRST["on"] and _COMPOSER_CALLS["n"] == 1:
            widget_id = "proj-finni"
        else:
            widget_id = (_ROW.get("allowed_ids") or [_ROW["id"]])[0]
        parsed = AgentResponse(
            language=_ROW["language"],
            title=_ROW["id"],
            summary="Respuesta de paridad.",
            widgets=[{"id": widget_id, "type": "text", "data": {}}],
            suggested_actions=[],
        )
        return {"raw": raw, "parsed": parsed}


def test_prompts_are_split_between_router_and_composer():
    assert "TOOL USAGE" in ROUTER_PROMPT
    assert "LANGUAGE" in ROUTER_PROMPT
    assert "GROUNDING RULES" not in ROUTER_PROMPT
    assert "GROUNDING RULES" in COMPOSER_PROMPT
    assert "TOOL USAGE" not in COMPOSER_PROMPT
    assert "TOOL USAGE" in SYSTEM_PROMPT
    assert "GROUNDING RULES" in SYSTEM_PROMPT


def test_portfolio_graph_compiles_with_deferred_evidence():
    graph = build_portfolio_graph()
    assert isinstance(graph.checkpointer, MemorySaver)
    assert graph.builder.nodes["evidencia"].defer is True
    assert {"router", "bibliotecario", "investigador", "evidencia", "compositor"} <= set(graph.nodes)


def test_langgraph_matches_the_golden_set(monkeypatch):
    monkeypatch.setattr("app.graph.nodes.get_chat_model", lambda: _NodeModel())
    monkeypatch.setattr("app.services.chat_stream.settings.GRAPH_ENGINE", "langgraph")
    _BAD_FIRST["on"] = False

    async def run() -> None:
        for row in load_questions():
            _ROW.clear()
            _ROW.update(row)
            _COMPOSER_CALLS["n"] = 0
            events = [event async for event in stream_chat_events(row["question"])]
            assert events[0]["type"] == "started", row["id"]
            assert events[-1]["type"] == "done", row["id"]
            assert not any(event["type"] == "error" for event in events), row["id"]
            tools = [event["tool"] for event in events if event["type"] == "tool_call"]
            assert tools == row["expected_tools"], row["id"]
            response = events[-1]["response"]
            assert response["language"] == row["language"], row["id"]
            ids = [widget["id"] for widget in response["widgets"]]
            assert ids == (row.get("allowed_ids") or [row["id"]]), row["id"]
            assert any(event.get("phase") == "thinking" for event in events), row["id"]
            assert any(event.get("phase") == "synthesizing" for event in events), row["id"]

    asyncio.run(run())


def test_composer_retries_once_when_a_project_id_is_outside_the_pack(monkeypatch):
    monkeypatch.setattr("app.graph.nodes.get_chat_model", lambda: _NodeModel())
    _ROW.clear()
    _ROW.update({"id": "repair", "language": "es", "expected_tools": ["get_skills"], "allowed_ids": ["skills-widget"]})
    _BAD_FIRST["on"] = True
    _COMPOSER_CALLS["n"] = 0
    graph = build_portfolio_graph()
    state = asyncio.run(
        graph.ainvoke(
            {"question": "skills", "attempts": 0, "passages": [], "messages": []},
            config={"configurable": {"thread_id": "repair"}},
        )
    )
    chat_calls = [item for item in state["metrics"] if item["total_tokens"] >= 1]
    assert len(chat_calls) == 3
    assert state["response"]["widgets"][0]["id"] == "skills-widget"
    assert state["passages"] == []
    assert "get_projects" not in state["facts"]["tools"]
