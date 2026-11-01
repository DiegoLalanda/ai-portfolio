"""Trazas OpenTelemetry por nodo, sin Phoenix en CI."""

import asyncio

from langchain_core.messages import AIMessage

from app.core.config import settings
from app.graph.builder import build_portfolio_graph
from app.graph.decision import RouterDecision
from app.observability.tracing import _collector_endpoint, clear_traces, configure_tracing, exported_spans
from app.schemas.agent_response import AgentResponse


class _TraceModel:
    def with_structured_output(self, schema, **_kwargs):
        self.schema = schema
        return self

    async def ainvoke(self, _messages):
        usage = {"input_tokens": 2, "output_tokens": 1, "total_tokens": 3}
        raw = AIMessage(content="{}", usage_metadata=usage)
        if self.schema is RouterDecision:
            return {
                "raw": raw,
                "parsed": RouterDecision(
                    route="facts",
                    tools=["get_skills"],
                    language="es",
                    retrieval_query="",
                ),
            }
        return {
            "raw": raw,
            "parsed": AgentResponse(
                language="es",
                title="Trazas",
                summary="Ok.",
                widgets=[{"id": "skills-widget", "type": "skills", "data": {}}],
                suggested_actions=[],
            ),
        }


def test_collector_endpoint_normalizes_railway_base_url():
    assert _collector_endpoint("https://phoenix.example.up.railway.app") == (
        "https://phoenix.example.up.railway.app/v1/traces"
    )
    assert _collector_endpoint("https://phoenix.example.up.railway.app/v1/traces") == (
        "https://phoenix.example.up.railway.app/v1/traces"
    )


def test_graph_nodes_emit_spans_with_prompt_version(monkeypatch):
    configure_tracing()
    clear_traces()
    monkeypatch.setattr("app.graph.nodes.get_chat_model", lambda _key="": _TraceModel())
    graph = build_portfolio_graph()
    asyncio.run(
        graph.ainvoke(
            {
                "question": "¿Skills?",
                "visitor_question": "¿Skills?",
                "attempts": 0,
                "passages": [],
                "messages": [],
            },
            config={"configurable": {"thread_id": "trace-test"}},
        )
    )
    names = {span.name for span in exported_spans()}
    assert {"router", "bibliotecario", "investigador", "evidencia", "compositor"} <= names
    versions = {
        span.attributes.get("prompt.version")
        for span in exported_spans()
        if span.attributes
    }
    assert settings.PROMPT_VERSION in versions


def test_health_does_not_require_phoenix():
    from fastapi.testclient import TestClient

    from app.main import app

    assert TestClient(app).get("/health").json() == {"status": "ok"}
