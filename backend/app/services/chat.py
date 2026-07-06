"""Servicio de chat: genera la respuesta a la pregunta del usuario con Gemini.

Todavía responde únicamente texto plano. Más adelante esta respuesta se
transformará en datos estructurados para alimentar dashboards interactivos.
"""

from google.genai import errors as genai_errors

from app.ai.gemini import generate_async

SYSTEM_PROMPT = (
    "You are the AI assistant embedded in Diego's personal portfolio website. "
    "Diego is a Software Engineer, AI Engineer and Physics Professor. "
    "Answer the visitor's question as if you were presenting Diego's experience "
    "and skills. Keep the answer concise (2-4 sentences) and in plain text, "
    "since it will be displayed directly in the UI."
)


class ChatServiceError(Exception):
    """Error al obtener una respuesta del proveedor de IA."""


async def get_answer(question: str) -> str:
    prompt = f"{SYSTEM_PROMPT}\n\nVisitor's question: {question}"
    try:
        return await generate_async(prompt)
    except genai_errors.APIError as error:
        raise ChatServiceError(f"Gemini API error: {error}") from error
