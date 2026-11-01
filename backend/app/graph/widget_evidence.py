"""Widgets deterministas desde facts del bibliotecario (preview y post-proceso)."""

from __future__ import annotations

from typing import Any

from app.schemas.agent_response import AgentResponse, Widget, WidgetType

TOOL_TO_WIDGET: dict[str, WidgetType] = {
    "get_experience": "experience",
    "get_skills": "skills",
    "get_projects": "projects",
    "get_contact": "contact",
    "get_education": "education",
    "get_timeline": "timeline",
    "get_certifications": "certifications",
    "get_languages": "languages",
    "get_soft_skills": "soft-skills",
}

WIDGET_TO_TOOL = {widget: tool for tool, widget in TOOL_TO_WIDGET.items()}


def _skills_widget_data(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict) and "categories" in raw:
        return raw
    if isinstance(raw, list):
        categories: dict[str, list[str]] = {}
        for item in raw:
            if not isinstance(item, dict):
                continue
            category = str(item.get("category") or "other")
            name = item.get("name")
            if isinstance(name, str):
                categories.setdefault(category, []).append(name)
        return {"categories": categories}
    return {"categories": {}}


def _widget_data(tool: str, raw: Any) -> dict[str, Any]:
    if tool == "get_skills":
        return _skills_widget_data(raw)
    if tool == "get_experience":
        return {"items": raw if isinstance(raw, list) else []}
    if tool == "get_projects":
        return {}
    if tool == "get_contact" and isinstance(raw, dict):
        return {
            key: raw[key]
            for key in ("email", "phone", "location", "links")
            if key in raw
        }
    if tool in {"get_education", "get_timeline", "get_certifications", "get_languages", "get_soft_skills"}:
        return {"items": raw if isinstance(raw, list) else []}
    return {}


def widget_from_tool(tool: str, raw: Any) -> Widget | None:
    wtype = TOOL_TO_WIDGET.get(tool)
    if not wtype:
        return None
    slug = tool.removeprefix("get_").replace("_", "-")
    return Widget(id=f"{slug}-evidence", type=wtype, title=None, data=_widget_data(tool, raw))


def build_fact_widgets(tools: dict[str, Any], *, passages: list[Any]) -> list[Widget]:
    widgets: list[Widget] = []
    for name in TOOL_TO_WIDGET:
        if name not in tools:
            continue
        built = widget_from_tool(name, tools[name])
        if built is not None:
            widgets.append(built)
    if passages:
        widgets.append(
            Widget(
                id="architecture-notes",
                type="technology-cloud",
                title=None,
                data={"items": []},
            )
        )
    return widgets


def _placeholder_copy(language: str) -> tuple[str, str]:
    if language == "en":
        return ("Preparing answer", "Loading dashboard from portfolio data…")
    return ("Preparando respuesta", "Armando el tablero con los datos del portfolio…")


def preview_response(
    tools: dict[str, Any],
    *,
    passages: list[Any],
    language: str,
) -> AgentResponse:
    title, summary = _placeholder_copy(language)
    return AgentResponse(
        language=language,
        title=title,
        summary=summary,
        widgets=build_fact_widgets(tools, passages=passages),
        suggested_actions=[],
    )


def align_response_with_evidence(
    response: AgentResponse,
    tools: dict[str, Any],
    *,
    passages: list[Any],
) -> AgentResponse:
    tools_run = set(tools.keys())
    allowed_types = {TOOL_TO_WIDGET[t] for t in tools_run if t in TOOL_TO_WIDGET}
    if passages:
        allowed_types.add("technology-cloud")

    kept: list[Widget] = []
    for widget in response.widgets:
        mapped_tool = WIDGET_TO_TOOL.get(widget.type)
        if mapped_tool is not None and mapped_tool not in tools_run:
            continue
        if widget.type == "technology-cloud" and not passages:
            continue
        kept.append(widget)

    present_types = {widget.type for widget in kept}
    for tool, wtype in TOOL_TO_WIDGET.items():
        if tool not in tools_run or wtype in present_types:
            continue
        stub = widget_from_tool(tool, tools[tool])
        if stub is not None:
            kept.append(stub)
            present_types.add(wtype)

    return response.model_copy(update={"widgets": kept})


def ensure_passage_widgets(response: AgentResponse, passages: list[Any]) -> AgentResponse:
    """Si hay pasajes RAG, evita quedarse solo con un widget text genérico."""

    if not passages:
        return response
    types = {widget.type for widget in response.widgets}
    if "technology-cloud" in types:
        return response

    kept = [
        widget
        for widget in response.widgets
        if not (widget.type == "text" and widget.id != "cv-download")
    ]
    kept.append(
        Widget(
            id="architecture-notes",
            type="technology-cloud",
            title=None,
            data={"items": []},
        )
    )
    return response.model_copy(update={"widgets": kept})
