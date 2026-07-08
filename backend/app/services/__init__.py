"""Servicios de aplicación (orquestación de lógica de negocio).

La capa de servicios conecta endpoints HTTP con integraciones externas
(p. ej. Gemini vía `app.services.chat`). No contiene lógica de IA ni acceso
directo a datos del portfolio: eso vive en `app.ai`, `app.prompts` y
`app.tools`.
"""

from app.services.chat import ChatServiceError, get_answer

__all__ = ["ChatServiceError", "get_answer"]
