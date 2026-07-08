"""Esquemas Pydantic para requests/responses de la API.

Incluye el contrato estructurado del agente (`agent_response.py`) y los
modelos del endpoint de chat (`chat.py`). Ver `schemas/README.md` para el
catálogo de widgets soportados.
"""

from app.schemas.agent_response import AgentResponse, SuggestedAction, Widget
from app.schemas.chat import ChatRequest, ChatResponse

__all__ = [
    "AgentResponse",
    "ChatRequest",
    "ChatResponse",
    "SuggestedAction",
    "Widget",
]
