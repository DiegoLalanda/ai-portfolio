"""Tool: get_certifications.

Devuelve las certificaciones y cursos del portfolio
(`app/data/certifications.json`).
"""

from typing import Any

from app.utils.json_loader import load_visible_items

FILENAME = "certifications.json"


def get_certifications() -> list[dict[str, Any]]:
    """Devuelve la lista de certificaciones visibles, ordenadas por `order`."""
    return load_visible_items(FILENAME)
