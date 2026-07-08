"""Plantillas de prompts utilizadas por la capa de IA.

Cada prompt vive en su propio módulo/archivo para poder versionarlo y
editarlo de forma aislada (ver `system.py` para el System Prompt principal
del agente).
"""

from app.prompts.system import SYSTEM_PROMPT

__all__ = ["SYSTEM_PROMPT"]
