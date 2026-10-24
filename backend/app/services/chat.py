"""Servicio de chat: genera la respuesta a la pregunta del usuario con Gemini."""

import pydantic
from google.genai import errors as genai_errors

from app.ai.gemini import generate_async
from app.core.config import settings
from app.prompts import SYSTEM_PROMPT
from app.schemas.agent_response import AgentResponse
from app.services.chat_context import build_agent_prompt
from app.services.graph_session import prepare_graph_turn
from app.graph.builder import get_portfolio_graph


class ChatServiceError(Exception):
    """Error al obtener una respuesta del proveedor de IA."""


async def get_answer(
    question: str,
    *,
    shown_widget_types: list[str] | None = None,
    prior_questions: list[str] | None = None,
    thread_id: str | None = None,
) -> AgentResponse:
    try:
        if settings.GRAPH_ENGINE == "langgraph":
            _prompt, config, graph_input = await prepare_graph_turn(
                question,
                shown_widget_types=shown_widget_types,
                prior_questions=prior_questions,
                thread_id=thread_id,
            )
            state = await get_portfolio_graph().ainvoke(graph_input, config=config)
            return AgentResponse.model_validate(state["response"])
        prompt = build_agent_prompt(
            question,
            shown_widget_types=shown_widget_types,
            prior_questions=prior_questions,
        )
        return await generate_async(prompt, system_instruction=SYSTEM_PROMPT)
    except TimeoutError as error:
        raise ChatServiceError("El modelo tardó demasiado.") from error
    except genai_errors.APIError as error:
        raise ChatServiceError(f"Gemini API error: {error}") from error
    except pydantic.ValidationError as error:
        raise ChatServiceError(f"Gemini devolvió una respuesta que no cumple el schema esperado: {error}") from error
