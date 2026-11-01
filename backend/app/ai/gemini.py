"""Generación con Gemini — wrapper sobre el agente con eventos."""

from app.ai.gemini_agent import generate_with_events
from app.schemas.agent_response import AgentResponse


def generate(prompt: str, system_instruction: str | None = None) -> AgentResponse:
    import asyncio

    return asyncio.run(generate_with_events(prompt, system_instruction))


async def generate_async(prompt: str, system_instruction: str | None = None) -> AgentResponse:
    return await generate_with_events(prompt, system_instruction)
