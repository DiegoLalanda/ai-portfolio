"""Hilo LangGraph: prior_questions en checkpointer cuando hay thread_id."""

import asyncio

from langchain_core.messages import AIMessage

from app.graph.builder import build_portfolio_graph, set_portfolio_graph
from app.graph.decision import RouterDecision
from app.schemas.agent_response import AgentResponse
from app.services.graph_session import prepare_graph_turn


class _ThreadModel:
    def __init__(self) -> None:
        self.schema = None
        self.router_inputs: list[str] = []

    def with_structured_output(self, schema, **_kwargs):
        self.schema = schema
        return self

    async def ainvoke(self, messages):
        if self.schema is RouterDecision:
            self.router_inputs.append(messages[-1].content)
        usage = {"input_tokens": 4, "output_tokens": 2, "total_tokens": 6}
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
                title="Ok",
                summary="Respuesta corta.",
                widgets=[{"id": "skills-widget", "type": "skills", "data": {}}],
                suggested_actions=[],
            ),
        }


def test_without_thread_id_uses_client_prior_questions():
    prompt, config, _graph_input = asyncio.run(
        prepare_graph_turn(
            "Segunda pregunta",
            shown_widget_types=[],
            prior_questions=["Primera pregunta"],
            thread_id=None,
        )
    )
    assert "Primera pregunta" in prompt
    assert config["configurable"]["thread_id"]


def test_thread_id_reuses_server_session_questions(monkeypatch):
    model = _ThreadModel()
    monkeypatch.setattr("app.graph.nodes.get_chat_model", lambda _key="": model)
    graph = build_portfolio_graph()
    set_portfolio_graph(graph)
    thread = "pytest-thread-session"

    asyncio.run(
        graph.ainvoke(
            {
                "question": "Primera",
                "visitor_question": "Primera",
                "attempts": 0,
                "passages": [],
                "messages": [],
            },
            config={"configurable": {"thread_id": thread}},
        )
    )

    _prompt, config, graph_input = asyncio.run(
        prepare_graph_turn(
            "Segunda",
            shown_widget_types=[],
            prior_questions=[],
            thread_id=thread,
        )
    )
    assert "Primera" in _prompt
    assert "Prior questions in this session" in _prompt
    assert config["configurable"]["thread_id"] == thread

    asyncio.run(graph.ainvoke(graph_input, config=config))
    assert any("Primera" in item for item in model.router_inputs)


def test_sqlite_fallback_still_answers(monkeypatch):
    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def broken(_conn: str):
        raise RuntimeError("sqlite")
        yield  # pragma: no cover

    monkeypatch.setattr(
        "langgraph.checkpoint.sqlite.aio.AsyncSqliteSaver.from_conn_string",
        broken,
    )
    from app.graph.checkpointer import start_checkpointer

    saver = asyncio.run(start_checkpointer("data/should-not-open.sqlite"))
    from langgraph.checkpoint.memory import MemorySaver

    assert isinstance(saver, MemorySaver)
