"""Tool: get_skills.

Devuelve las skills técnicas del portfolio (`app/data/skills.json`),
opcionalmente filtradas por categoría y agrupadas para el widget de skills.
"""

from typing import Any

from app.utils.json_loader import load_visible_items

FILENAME = "skills.json"

VALID_CATEGORIES = frozenset(
    {"ai", "frontend", "backend-data", "cloud-devops", "design-cms-other", "gamedev"}
)


def _group_by_category(items: list[dict[str, Any]]) -> dict[str, list[str]]:
    categories: dict[str, list[str]] = {}
    for item in items:
        category = item.get("category", "other")
        categories.setdefault(category, []).append(item["name"])
    return categories


def get_skills(
    category: str | None = None,
    featured_only: bool = False,
    grouped: bool = False,
) -> dict[str, Any] | list[dict[str, Any]]:
    """Devuelve skills visibles del portfolio.

    Usa `category` cuando la pregunta es de un dominio concreto (p. ej.
    category="ai" para IA/LLMs). Dentro de esa categoría, `featured_only=True`
    devuelve un subconjunto más conciso.

    Usa `grouped=True` solo al armar el widget skills en la respuesta; devuelve
    `{"categories": {"ai": ["Python", ...], ...}}` listo para copiar en `data`.
    Con `grouped=False` (default) devuelve la lista plana de objetos skill.
    """
    items = load_visible_items(FILENAME)

    if category is not None:
        if category not in VALID_CATEGORIES:
            return {"categories": {}} if grouped else []
        items = [item for item in items if item.get("category") == category]

    if featured_only:
        items = [item for item in items if item.get("featured", False)]

    if grouped:
        return {"categories": _group_by_category(items)}

    return items
