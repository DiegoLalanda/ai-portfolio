"""Hilo del grafo: prior_questions en SQLite o en el body del request."""

from __future__ import annotations

from uuid import uuid4

from app.graph.builder import get_portfolio_graph
from app.services.chat_context import build_agent_prompt


async def prepare_graph_turn(
    question: str,
    *,
    shown_widget_types: list[str] | None,
    prior_questions: list[str] | None,
    thread_id: str | None,
) -> tuple[str, dict, dict]:
    """Devuelve prompt, config de LangGraph e input inicial del turno."""

    config = {"configurable": {"thread_id": (thread_id or str(uuid4())).strip()}}
    prior = list(prior_questions or [])
    if thread_id and thread_id.strip():
        snapshot = await get_portfolio_graph().aget_state(config)
        stored = (snapshot.values or {}).get("session_questions") or []
        if stored:
            prior = list(stored)[-6:]
    prompt = build_agent_prompt(
        question,
        shown_widget_types=shown_widget_types,
        prior_questions=prior,
    )
    graph_input = {
        "question": prompt,
        "visitor_question": question.strip(),
        "attempts": 0,
        "passages": [],
        "messages": [],
    }
    return prompt, config, graph_input
