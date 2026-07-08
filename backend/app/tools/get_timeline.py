"""Tool: get_timeline.

Devuelve la línea de tiempo unificada del portfolio (`app/data/timeline.json`),
que referencia entradas de experiencia, educación, proyectos y
certificaciones (o hitos sueltos) en orden cronológico.
"""

from typing import Any

from app.utils.json_loader import load_visible_items

FILENAME = "timeline.json"


def get_timeline() -> list[dict[str, Any]]:
    """Devuelve la lista de hitos visibles, ordenados por `order`."""
    return load_visible_items(FILENAME)
