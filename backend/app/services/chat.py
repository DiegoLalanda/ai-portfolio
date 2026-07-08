"""Servicio de chat: genera la respuesta a la pregunta del usuario con Gemini.

El modelo responde consultando sus tools (function calling automático) y
devuelve un `AgentResponse` estructurado (título, resumen, widgets, acciones
sugeridas) en vez de texto plano — ver `app/ai/gemini.py` y
`app/schemas/agent_response.py` para el detalle de cada pieza.
"""

import pydantic
from google.genai import errors as genai_errors

from app.ai.gemini import generate_async
from app.prompts import SYSTEM_PROMPT
from app.schemas.agent_response import AgentResponse


class ChatServiceError(Exception):
    """Error al obtener una respuesta del proveedor de IA."""


async def get_answer(question: str) -> AgentResponse:
    try:
        return await generate_async(question, system_instruction=SYSTEM_PROMPT)
    except genai_errors.APIError as error:
        raise ChatServiceError(f"Gemini API error: {error}") from error
    except pydantic.ValidationError as error:
        raise ChatServiceError(f"Gemini devolvió una respuesta que no cumple el schema esperado: {error}") from error
