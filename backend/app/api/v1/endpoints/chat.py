"""Endpoint de chat. Responde con el contrato estructurado `ChatResponse`
(título, resumen, widgets, acciones sugeridas) generado por Gemini."""

import logging

from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat import ChatServiceError, get_answer

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    logger.info("POST /chat question=%r", payload.question)
    try:
        agent_response = await get_answer(payload.question)
    except ChatServiceError as error:
        logger.error("Error al generar respuesta con Gemini: %s", error)
        raise HTTPException(status_code=502, detail="Failed to get a response from the AI provider.") from error
    return ChatResponse(**agent_response.model_dump())
