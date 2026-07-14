"""Tool: get_soft_skills.

Devuelve las habilidades blandas / transferibles del portfolio
(`app/data/softskills.json`).
"""

from typing import Any

from app.utils.json_loader import load_visible_items

FILENAME = "softskills.json"


def get_soft_skills() -> list[dict[str, Any]]:
    """Devuelve la lista de habilidades blandas visibles, ordenadas por `order`."""
    return load_visible_items(FILENAME)
