"""Tool: get_projects.

Devuelve los proyectos del portfolio (`app/data/projects.json`), ordenados por
`displayGroup` (full-stack, ia, otras).
"""

from typing import Any

from app.utils.json_loader import load_visible_items

FILENAME = "projects.json"

DISPLAY_GROUP_ORDER = ("full-stack", "ia", "otras")


def get_projects(
    display_group: str | None = None,
    featured_only: bool = False,
) -> list[dict[str, Any]]:
    """Devuelve proyectos visibles del portfolio.

    Usa `display_group` para filtrar por sección del board (full-stack, ia, otras).
    Sin filtro (None) → todas las secciones; usalo en preguntas amplias
    ("proyectos", freelance+universidad+personales, más de un tipo).
    Con `featured_only=True` devuelve solo los destacados.

    El frontend arma el board agrupado desde el catálogo; incluí el widget
    `projects` cuando pregunten por proyectos — no hace falta listar todos los
    items en `data`.
    """
    items = load_visible_items(FILENAME)

    if display_group is not None:
        if display_group not in DISPLAY_GROUP_ORDER:
            return []
        items = [item for item in items if item.get("displayGroup") == display_group]

    if featured_only:
        items = [item for item in items if item.get("featured", False)]

    group_rank = {group: index for index, group in enumerate(DISPLAY_GROUP_ORDER)}

    return sorted(
        items,
        key=lambda item: (
            group_rank.get(item.get("displayGroup", ""), 99),
            item.get("order", 0),
        ),
    )
