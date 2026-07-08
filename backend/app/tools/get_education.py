"""Tool: get_education.

Devuelve la educación formal del portfolio (`app/data/education.json`):
títulos y tecnicaturas.
"""

from typing import Any

from app.utils.json_loader import load_visible_items

FILENAME = "education.json"


def get_education() -> list[dict[str, Any]]:
    """Devuelve la lista de educación visible, ordenada por `order`."""
    return load_visible_items(FILENAME)
