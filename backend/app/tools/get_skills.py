"""Tool: get_skills.

Devuelve las skills técnicas del portfolio (`app/data/skills.json`),
agrupadas por `category` (ai, cloud-devops, frontend, backend-data,
design-cms-other).
"""

from typing import Any

from app.utils.json_loader import load_visible_items

FILENAME = "skills.json"


def get_skills() -> list[dict[str, Any]]:
    """Devuelve la lista de skills visibles, ordenadas por `order`."""
    return load_visible_items(FILENAME)
