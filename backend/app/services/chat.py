"""Servicio de chat: genera la respuesta a la pregunta del usuario con Gemini."""

import pydantic
from google.genai import errors as genai_errors

from app.ai.gemini import generate_async
from app.prompts import SYSTEM_PROMPT
from app.schemas.agent_response import AgentResponse
from app.services.chat_context import build_agent_prompt


class ChatServiceError(Exception):
    """Error al obtener una respuesta del proveedor de IA."""


async def get_answer(
    question: str,
    *,
    shown_widget_types: list[str] | None = None,
    prior_questions: list[str] | None = None,
) -> AgentResponse:
    prompt = build_agent_prompt(
        question,
        shown_widget_types=shown_widget_types,
        prior_questions=prior_questions,
    )
    try:
        return await generate_async(prompt, system_instruction=SYSTEM_PROMPT)
    except genai_errors.APIError as error:
        raise ChatServiceError(f"Gemini API error: {error}") from error
    except pydantic.ValidationError as error:
        raise ChatServiceError(f"Gemini devolvió una respuesta que no cumple el schema esperado: {error}") from error
