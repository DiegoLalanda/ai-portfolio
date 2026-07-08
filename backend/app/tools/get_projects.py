"""Tool: get_projects.

Devuelve los proyectos del portfolio (`app/data/projects.json`), listos para
que el agente los use al responder preguntas sobre proyectos concretos o
sobre el trabajo de Diego en general.
"""

from typing import Any

from app.utils.json_loader import load_visible_items

FILENAME = "projects.json"


def get_projects() -> list[dict[str, Any]]:
    """Devuelve la lista de proyectos visibles, ordenados por `order`."""
    return load_visible_items(FILENAME)
