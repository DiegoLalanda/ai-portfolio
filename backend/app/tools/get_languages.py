"""Tool: get_languages.

Devuelve los idiomas del portfolio (`app/data/languages.json`) y su nivel de
proficiencia.
"""

from typing import Any

from app.utils.json_loader import load_visible_items

FILENAME = "languages.json"


def get_languages() -> list[dict[str, Any]]:
    """Devuelve la lista de idiomas visibles, ordenada por `order`."""
    return load_visible_items(FILENAME)
