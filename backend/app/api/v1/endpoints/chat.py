"""Chat del portfolio: LangGraph por defecto (`GRAPH_ENGINE=langgraph`) o loop legacy.

Responde con `ChatResponse` / SSE (`AgentResponse`: título, resumen, widgets, acciones)."""

import json
import logging

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat import ChatServiceError, get_answer
from app.services.chat_stream import STREAM_CLIENT_ERROR, stream_chat_events
from app.core.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

router = APIRouter()


def _context_kwargs(payload: ChatRequest) -> dict:
    thread_id = str(payload.thread_id) if payload.thread_id is not None else None
    return {
        "shown_widget_types": payload.shown_widget_types,
        "prior_questions": payload.prior_questions,
        "thread_id": thread_id,
    }


@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(rate_limiter)])
async def chat(payload: ChatRequest) -> ChatResponse:
    logger.info("POST /chat question=%r", payload.question)
    try:
        agent_response = await get_answer(payload.question, **_context_kwargs(payload))
    except ChatServiceError as error:
        logger.error("Error al generar respuesta con Gemini: %s", error)
        raise HTTPException(status_code=502, detail="Failed to get a response from the AI provider.") from error
    return ChatResponse(**agent_response.model_dump())


@router.post("/chat/stream", dependencies=[Depends(rate_limiter)])
async def chat_stream(payload: ChatRequest) -> StreamingResponse:
    logger.info("POST /chat/stream question=%r", payload.question)

    async def event_generator():
        try:
            async for event in stream_chat_events(payload.question, **_context_kwargs(payload)):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except Exception as error:  # noqa: BLE001 — informar al cliente SSE
            logger.exception("Error en stream de chat")
            yield f"data: {json.dumps({'type': 'error', 'message': STREAM_CLIENT_ERROR}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
