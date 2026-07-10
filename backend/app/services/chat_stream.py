"""Servicio de chat con streaming SSE."""

from collections.abc import AsyncIterator

from app.ai.gemini_agent import stream_answer_events
from app.prompts import SYSTEM_PROMPT


async def stream_chat_events(question: str) -> AsyncIterator[dict]:
    async for event in stream_answer_events(question, system_instruction=SYSTEM_PROMPT):
        yield event
