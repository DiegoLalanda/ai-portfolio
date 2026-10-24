"""Servicio de chat con streaming SSE."""

from collections.abc import AsyncIterator

from app.ai.gemini_agent import stream_answer_events
from app.core.config import settings
from app.prompts import SYSTEM_PROMPT
from app.services.chat_context import build_agent_prompt

GRAPH_ENGINE_UNAVAILABLE = "El motor langgraph todavía no está disponible."


async def stream_chat_events(
    question: str,
    *,
    shown_widget_types: list[str] | None = None,
    prior_questions: list[str] | None = None,
) -> AsyncIterator[dict]:
    if settings.GRAPH_ENGINE == "langgraph":
        yield {"type": "error", "message": GRAPH_ENGINE_UNAVAILABLE}
        return

    prompt = build_agent_prompt(
        question,
        shown_widget_types=shown_widget_types,
        prior_questions=prior_questions,
    )
    async for event in stream_answer_events(prompt, system_instruction=SYSTEM_PROMPT):
        yield event
