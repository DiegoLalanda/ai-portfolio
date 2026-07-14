"""Tools/funciones invocables por el modelo (function calling).

Cada tool vive en su propio módulo, lee un único archivo de `app/data/` y no
depende de las demás tools (son completamente independientes entre sí). No
hay base de datos, embeddings ni RAG: todo el contenido sale directo de los
archivos JSON del portfolio (ver `app/data/README.md`).

Estas funciones están registradas en `app/ai/gemini.py` (`TOOLS`) y se pasan
tal cual al SDK de Gemini, que arma el schema de cada una a partir de su
firma y docstring y decide solo cuáles invocar (Automatic Function Calling).
"""

from app.tools.get_certifications import get_certifications
from app.tools.get_contact import get_contact
from app.tools.get_education import get_education
from app.tools.get_experience import get_experience
from app.tools.get_languages import get_languages
from app.tools.get_projects import get_projects
from app.tools.get_skills import get_skills
from app.tools.get_soft_skills import get_soft_skills
from app.tools.get_timeline import get_timeline

__all__ = [
    "get_certifications",
    "get_contact",
    "get_education",
    "get_experience",
    "get_languages",
    "get_projects",
    "get_skills",
    "get_soft_skills",
    "get_timeline",
]
