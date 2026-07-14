"""Esquemas Pydantic para el endpoint de chat."""

from pydantic import BaseModel, Field

from app.schemas.agent_response import AgentResponse


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500, description="Pregunta enviada por el usuario.")
    shown_widget_types: list[str] = Field(
        default_factory=list,
        description="Tipos de widget ya visibles en el dashboard de esta sesión (follow-ups).",
    )
    prior_questions: list[str] = Field(
        default_factory=list,
        description="Preguntas previas del visitante en la misma sesión.",
    )


class ChatResponse(AgentResponse):
    """Respuesta de POST /chat. Mismo contrato que `AgentResponse` (ver agent_response.py)."""
