"""Tool: get_contact.

Devuelve los datos de contacto del portfolio (`app/data/contact.json`). A
diferencia del resto de las tools, este archivo es un objeto único (no una
lista), por lo que no aplica el filtro/orden de `load_visible_items`.
"""

from typing import Any

from app.utils.json_loader import load_json_data

FILENAME = "contact.json"


def get_contact() -> dict[str, Any]:
    """Devuelve el objeto de contacto tal cual está en contact.json."""
    return load_json_data(FILENAME)
