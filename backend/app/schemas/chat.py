"""Esquemas Pydantic para el endpoint de chat."""

from pydantic import BaseModel, Field

from app.schemas.agent_response import AgentResponse


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Pregunta enviada por el usuario.")


class ChatResponse(AgentResponse):
    """Respuesta de POST /chat. Mismo contrato que `AgentResponse` (ver agent_response.py)."""
