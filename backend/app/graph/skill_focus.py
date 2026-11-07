"""Acota skills cuando la pregunta es de un tema concreto.

El catálogo empieza por IA. Si el compositor ve todo el listado, responde con
Python y FastAPI aunque hayan preguntado por bases de datos. Acá se eligen
los nombres que sí responden y el compositor solo recibe esos.
"""

from __future__ import annotations

import unicodedata
from typing import Any

# Frases de la pregunta → tags (y nombres sueltos) que cuentan como respuesta.
_SCOPES: tuple[dict[str, Any], ...] = (
    {
        "phrases": (
            "base de datos",
            "bases de datos",
            "database",
            "databases",
            "sql",
            "nosql",
            "orm",
            "herramienta de datos",
            "herramientas de datos",
            "data tool",
            "data tools",
            "data platform",
            "plataforma de datos",
        ),
        "tags": frozenset({"database", "sql", "nosql", "orm", "etl", "analytics", "data", "postgresql"}),
        "names": frozenset({"redis"}),
    },
)


def _fold(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.casefold())
    return "".join(char for char in normalized if not unicodedata.combining(char))


def _iter_skills(raw: Any) -> list[dict[str, Any]]:
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict) and isinstance(item.get("name"), str)]
    if isinstance(raw, dict) and isinstance(raw.get("categories"), dict):
        items: list[dict[str, Any]] = []
        for names in raw["categories"].values():
            if isinstance(names, list):
                items.extend({"name": name, "tags": []} for name in names if isinstance(name, str))
        return items
    return []


def focus_skill_names(question: str, skills: Any) -> list[str] | None:
    """Nombres que responden la pregunta, en orden del catálogo. None si no hay tema acotado."""

    folded = _fold(question)
    tags: set[str] = set()
    names: set[str] = set()
    for scope in _SCOPES:
        if any(phrase in folded for phrase in scope["phrases"]):
            tags.update(scope["tags"])
            names.update(scope["names"])
    if not tags and not names:
        return None

    chosen: list[str] = []
    for item in _iter_skills(skills):
        skill_name = str(item["name"])
        skill_tags = {str(tag) for tag in item.get("tags") or []}
        if skill_name.casefold() in names or skill_tags & tags:
            chosen.append(skill_name)
    return chosen or None


def summary_mentions_any(summary: str, names: list[str]) -> bool:
    folded = _fold(summary)
    return any(_fold(name) in folded for name in names)


def focus_summary(language: str, names: list[str]) -> str:
    if len(names) == 1:
        listed = names[0]
    elif language == "en":
        listed = ", ".join(names[:-1]) + " and " + names[-1]
    else:
        listed = ", ".join(names[:-1]) + " y " + names[-1]
    if language == "en":
        return f"For that question, the portfolio lists: {listed}."
    return f"Para esa pregunta, en el portfolio figuran: {listed}."
