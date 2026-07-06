"""Esquemas Pydantic para el endpoint de chat."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Pregunta enviada por el usuario.")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="Respuesta generada para la pregunta recibida.")
