"""Chips de seguimiento cuando el compositor devuelve suggested_actions vacío."""

from __future__ import annotations

import re

from app.schemas.agent_response import AgentResponse, SuggestedAction, WidgetType

_DASHBOARD_CONTEXT_MARK = "## DASHBOARD CONTEXT"
_VISIBLE_LINE = re.compile(
    r"These widget types are ALREADY visible on the dashboard:\s*([^.]+)\.",
    re.IGNORECASE,
)

# Orden de preferencia para la primera pregunta de la sesión.
_TOPIC_ORDER: tuple[WidgetType, ...] = (
    "projects",
    "experience",
    "skills",
    "education",
    "contact",
    "certifications",
    "languages",
    "soft-skills",
    "timeline",
)

_TEMPLATES: dict[str, dict[WidgetType, tuple[str, str]]] = {
    "es": {
        "projects": ("Ver proyectos", "¿Qué proyectos destacados hiciste?"),
        "experience": ("Ver experiencia", "¿Cuál es tu experiencia profesional?"),
        "skills": ("Ver habilidades", "¿Qué stack y habilidades técnicas manejás?"),
        "education": ("Ver formación", "¿Cuál es tu formación académica?"),
        "contact": ("Contacto", "¿Cómo puedo contactarte?"),
        "certifications": ("Certificaciones", "¿Qué certificaciones tenés?"),
        "languages": ("Idiomas", "¿Qué idiomas hablás?"),
        "soft-skills": ("Soft skills", "¿Cuáles son tus habilidades blandas?"),
        "timeline": ("Línea de tiempo", "¿Cómo evolucionó tu carrera?"),
    },
    "en": {
        "projects": ("See projects", "What are Diego's featured projects?"),
        "experience": ("See experience", "What is Diego's professional experience?"),
        "skills": ("See skills", "What technologies and skills does Diego use?"),
        "education": ("See education", "What is Diego's educational background?"),
        "contact": ("Get in touch", "How can I contact Diego?"),
        "certifications": ("Certifications", "What certifications does Diego have?"),
        "languages": ("Languages", "What languages does Diego speak?"),
        "soft-skills": ("Soft skills", "What are Diego's soft skills?"),
        "timeline": ("Timeline", "How has Diego's career evolved?"),
    },
}


def has_dashboard_context(question_prompt: str) -> bool:
    return _DASHBOARD_CONTEXT_MARK in question_prompt


def parse_visible_widget_types(question_prompt: str) -> set[str]:
    match = _VISIBLE_LINE.search(question_prompt)
    if not match:
        return set()
    raw = match.group(1)
    return {part.strip() for part in raw.split(",") if part.strip()}


def _fallback_actions(
    language: str,
    *,
    forbidden: set[str],
    limit: int = 2,
) -> list[SuggestedAction]:
    catalog = _TEMPLATES.get(language) or _TEMPLATES["es"]
    actions: list[SuggestedAction] = []
    for topic in _TOPIC_ORDER:
        if topic in forbidden:
            continue
        if topic not in catalog:
            continue
        label, payload = catalog[topic]
        actions.append(SuggestedAction(label=label, action="ask", payload=payload))
        if len(actions) >= limit:
            break
    return actions


def ensure_suggested_actions(
    response: AgentResponse,
    *,
    question_prompt: str,
    min_actions: int = 2,
    max_actions: int = 3,
) -> AgentResponse:
    """Rellena chips cuando hay widgets pero el compositor no sugirió nada."""

    if response.suggested_actions:
        return response
    if not response.widgets:
        return response

    present = {widget.type for widget in response.widgets}
    forbidden = set(present)
    if has_dashboard_context(question_prompt):
        forbidden |= parse_visible_widget_types(question_prompt)

    needed = min(max_actions, max(min_actions, 2))
    actions = _fallback_actions(response.language, forbidden=forbidden, limit=needed)
    if not actions:
        return response
    return response.model_copy(update={"suggested_actions": actions})
