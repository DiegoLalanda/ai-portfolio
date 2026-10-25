"""Servicio de chat: genera la respuesta a la pregunta del usuario con Gemini."""

import logging

import pydantic
from google.genai import errors as genai_errors

from app.ai.gemini import generate_async
from app.core.config import settings
from app.graph.builder import get_portfolio_graph
from app.llm.errors import RATE_LIMIT_HINT, error_summary, is_retriable_capacity_error
from app.prompts import SYSTEM_PROMPT
from app.schemas.agent_response import AgentResponse
from app.services.chat_context import build_agent_prompt
from app.services.graph_session import prepare_graph_turn

logger = logging.getLogger(__name__)


class ChatServiceError(Exception):
    """Error al obtener una respuesta del proveedor de IA."""


def _service_error_from_exception(error: BaseException) -> ChatServiceError:
    if isinstance(error, TimeoutError):
        return ChatServiceError("El modelo tardó demasiado.")
    if is_retriable_capacity_error(error):
        return ChatServiceError(RATE_LIMIT_HINT)
    if isinstance(error, genai_errors.APIError):
        return ChatServiceError(f"Gemini API error: {error_summary(error)}")
    if isinstance(error, pydantic.ValidationError):
        return ChatServiceError(
            f"Gemini devolvió una respuesta que no cumple el schema esperado: {error_summary(error)}",
        )
    return ChatServiceError(f"Error al generar la respuesta: {error_summary(error)}")


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
    except ChatServiceError:
        raise
    except Exception as error:
        mapped = _service_error_from_exception(error)
        logger.error(
            "Chat falló question_len=%d thread_id=%s cause=%s",
            len(question),
            thread_id or "-",
            error_summary(error),
        )
        raise mapped from error
