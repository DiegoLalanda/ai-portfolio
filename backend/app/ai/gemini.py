"""Generación con Gemini — wrapper sobre el agente con eventos."""

import asyncio

from app.ai.gemini_agent import generate_with_events
from app.schemas.agent_response import AgentResponse


def generate(prompt: str, system_instruction: str | None = None) -> AgentResponse:
    return generate_with_events(prompt, system_instruction)


async def generate_async(prompt: str, system_instruction: str | None = None) -> AgentResponse:
    return await asyncio.to_thread(generate, prompt, system_instruction)
