"""Tool: get_experience.

Devuelve la experiencia profesional del portfolio (`app/data/experience.json`):
trabajos, freelance y docencia.
"""

from typing import Any

from app.utils.json_loader import load_visible_items

FILENAME = "experience.json"


def get_experience() -> list[dict[str, Any]]:
    """Devuelve la lista de experiencia visible, ordenada por `order`."""
    return load_visible_items(FILENAME)
