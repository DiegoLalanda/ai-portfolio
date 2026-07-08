"""Utilidades genéricas para leer los archivos JSON de app/data/.

No hay base de datos: todo el contenido del portfolio vive en archivos JSON
locales (ver `app/data/README.md` para el esquema y las convenciones de cada
archivo). Estas funciones centralizan cómo se resuelve la ruta, cómo se
parsea el archivo y cómo se filtran/ordenan las listas, para que cada tool
en `app/tools/` no repita esa lógica.

Este módulo es infraestructura compartida (I/O de archivos), no una tool en
sí misma: las tools siguen siendo independientes entre sí, cada una lee un
único archivo y no depende de las demás.
"""

import json
from pathlib import Path
from typing import Any

# app/utils/json_loader.py -> parent (app/utils) -> parent (app) / data
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_json_data(filename: str) -> Any:
    """Lee y parsea un archivo JSON dentro de app/data/ tal cual está.

    `filename` es el nombre del archivo con extensión, ej. "projects.json".
    """
    file_path = DATA_DIR / filename
    with file_path.open(encoding="utf-8") as file:
        return json.load(file)


def load_visible_items(filename: str) -> list[dict[str, Any]]:
    """Lee una colección (array) de app/data/, descarta las entradas con
    `visible: false` y las devuelve ordenadas por su campo `order`.

    Pensada para los archivos de datos que son listas de objetos
    (experience, projects, skills, education, certifications, languages,
    timeline). `contact.json` es un objeto único y no usa esta función.
    """
    items: list[dict[str, Any]] = load_json_data(filename)
    visible_items = [item for item in items if item.get("visible", True)]
    return sorted(visible_items, key=lambda item: item.get("order", 0))
