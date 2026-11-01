"""Idioma del visitante alineado con la respuesta del compositor."""

from __future__ import annotations

import re
from typing import Literal

from app.graph.suggested_actions import (
    _fallback_actions,
    has_dashboard_context,
    parse_visible_widget_types,
)
from app.schemas.agent_response import AgentResponse

VisitorLanguage = Literal["es", "en"]

_VISITOR_SECTION = "## VISITOR QUESTION"


def extract_visitor_question(question_prompt: str) -> str:
    if _VISITOR_SECTION in question_prompt:
        return question_prompt.split(_VISITOR_SECTION, 1)[1].strip()
    return question_prompt.strip()


def detect_visitor_language(text: str) -> VisitorLanguage:
    sample = text.strip()
    if not sample:
        return "es"

    spanish_hits = len(re.findall(r"[áéíóúñ¿¡]", sample, re.I))
    spanish_hits += len(
        re.findall(
            r"\b(el|la|los|las|de|del|que|con|para|como|experiencia|proyectos|habilidades|contame|mostrame|quién|qué|cómo)\b",
            sample,
            re.I,
        )
    )
    english_hits = len(
        re.findall(
            r"\b(the|and|his|her|what|about|experience|projects|skills|tell|show|me|with|from|contact|how|can|you)\b",
            sample,
            re.I,
        )
    )

    if english_hits > spanish_hits:
        return "en"
    if spanish_hits > english_hits:
        return "es"
    if re.search(r"[áéíóúñ¿¡]", sample, re.I):
        return "es"
    return "en"


def harmonize_response_language(
    response: AgentResponse,
    *,
    visitor_question: str,
    question_prompt: str,
    router_language: str,
) -> AgentResponse:
    """Corrige language y chips cuando el compositor elige el idioma equivocado."""

    probe = (visitor_question or extract_visitor_question(question_prompt)).strip()
    target = detect_visitor_language(probe) if probe else router_language
    if target not in {"es", "en"}:
        target = router_language if router_language in {"es", "en"} else "es"

    if response.language == target:
        return response

    forbidden = {widget.type for widget in response.widgets}
    if has_dashboard_context(question_prompt):
        forbidden |= parse_visible_widget_types(question_prompt)

    actions = _fallback_actions(target, forbidden=forbidden, limit=2) if response.widgets else []
    update: dict = {"language": target}
    if actions:
        update["suggested_actions"] = actions
    return response.model_copy(update=update)
