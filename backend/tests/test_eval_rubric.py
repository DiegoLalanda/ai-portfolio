"""Rúbrica offline: todo el golden set contra el grafo LangGraph, sin API key."""

import asyncio

from app.eval.golden_model import bind_golden_row, enable_bad_first_composer, golden_eval_model
from app.graph.builder import build_portfolio_graph
from app.services.chat_stream import stream_chat_events
from tests.test_golden_set import load_questions


def test_rubric_runs_graph_for_every_golden_row(monkeypatch):
    monkeypatch.setattr("app.graph.nodes.get_chat_model", golden_eval_model)
    monkeypatch.setattr("app.services.chat_stream.settings.GRAPH_ENGINE", "langgraph")

    async def run() -> None:
        for row in load_questions():
            bind_golden_row(row)
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

    asyncio.run(run())


def test_rubric_narrative_row_can_retrieve_when_rag_ready(monkeypatch):
    from app.core.config import settings
    from app.rag.hybrid import indice

    settings.EMBEDDING_PROVIDER = "hash"
    assert indice.cargar() >= 4
    monkeypatch.setattr("app.graph.nodes.get_chat_model", golden_eval_model)
    row = next(item for item in load_questions() if item["id"] == "narrative-finni-cola")
    bind_golden_row(row)
    graph = build_portfolio_graph()
    state = asyncio.run(
        graph.ainvoke(
            {
                "question": row["question"],
                "visitor_question": row["question"],
                "attempts": 0,
                "passages": [],
                "messages": [],
            },
            config={"configurable": {"thread_id": "rubric-narrative"}},
        )
    )
    assert state["passages"]


def test_rubric_repair_path_still_passes(monkeypatch):
    monkeypatch.setattr("app.graph.nodes.get_chat_model", golden_eval_model)
    bind_golden_row(
        {"id": "repair", "language": "es", "expected_tools": ["get_skills"], "allowed_ids": ["skills-widget"]}
    )
    enable_bad_first_composer()
    graph = build_portfolio_graph()
    state = asyncio.run(
        graph.ainvoke(
            {
                "question": "skills",
                "visitor_question": "skills",
                "attempts": 0,
                "passages": [],
                "messages": [],
            },
            config={"configurable": {"thread_id": "rubric-repair"}},
        )
    )
    chat_calls = [item for item in state["metrics"] if item["total_tokens"] >= 1]
    assert len(chat_calls) == 3
    assert state["response"]["widgets"][0]["id"] == "skills-widget"
