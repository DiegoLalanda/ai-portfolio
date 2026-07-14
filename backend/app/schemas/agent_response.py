"""Contrato de respuesta estructurada del agente (backend <-> frontend).

Reemplaza la respuesta de texto plano que devolvía `/chat` (`{"answer": str}`)
por un JSON que el frontend puede usar para armar un dashboard visual, no
solo mostrar un párrafo. Gemini genera esta estructura directamente
(`response_schema` + `response_mime_type="application/json"` en
`app/ai/gemini.py`), combinado con las tools de `app/tools/` para obtener
los datos reales antes de responder.

Forma del contrato:

    {
      "language": "en",
      "title": "Diego's AI & Backend experience",
      "summary": "Diego has spent the last months working as an AI Developer...",
      "widgets": [
        {
          "id": "experience-finnegans",
          "type": "experience",
          "title": "Relevant experience",
          "data": { "items": [ ... ] }
        }
      ],
      "suggested_actions": [
        { "label": "See all projects", "action": "ask", "payload": "What projects has Diego built?" }
      ]
    }

Diseño pensado para ser simple y extensible:
- `title` + `summary` son siempre texto plano y siempre están presentes, así
  el frontend tiene algo mostrable incluso si `widgets` viene vacío (por
  ejemplo, cuando la pregunta no amerita ningún componente visual).
- `widgets` es una lista abierta de bloques independientes. Cada widget se
  identifica por `type` (el "nombre del componente" que debe usar el
  frontend) y lleva su payload en `data`, que a propósito se modela como un
  dict genérico en vez de un modelo distinto por tipo. Esto permite agregar
  tipos de widget nuevos (sumándolos a `WidgetType` y documentándolos en
  `README.md`) sin romper compatibilidad con los que ya existen.
- `suggested_actions` son next-steps de bajo compromiso (otra pregunta, un
  link, contacto) para que la conversación se sienta guiada.

Cada `type` tiene un componente de React 1:1 del lado del frontend (ver
`frontend/src/components/react/agent-response/widgetRegistry.ts`). Si el
frontend recibe un `type` que no reconoce (por ejemplo porque este catálogo
creció y el frontend todavía no se actualizó), renderiza un fallback
genérico en vez de romper: por eso `type` es un string abierto y no un enum
estricto también del lado del cliente.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field

# Catálogo cerrado de tipos de widget soportados hoy. Ver README.md en esta
# misma carpeta para la forma esperada de `data` en cada uno, y el registro
# de componentes de React en el frontend. Agregar un tipo nuevo es sumarlo
# acá + documentarlo + crear su componente, no requiere tocar `Widget`.
WidgetType = Literal[
    "text",
    "timeline",
    "skills",
    "projects",
    "technology-cloud",
    "education",
    "contact",
    "experience",
    "certifications",
    "languages",
    "soft-skills",
]

# Qué debe hacer el frontend al activar una suggested_action.
ActionType = Literal["ask", "link", "contact"]


class Widget(BaseModel):
    """Un bloque visual independiente dentro de la respuesta del agente."""

    id: str = Field(..., description="Identificador único del widget dentro de esta respuesta (kebab-case).")
    type: WidgetType = Field(..., description="Discriminador: qué componente del frontend debe renderizar este widget.")
    title: str | None = Field(default=None, description="Título opcional a mostrar arriba del widget.")
    data: dict[str, Any] = Field(default_factory=dict, description="Payload específico del tipo de widget (ver README.md).")


class SuggestedAction(BaseModel):
    """Una acción de seguimiento de bajo compromiso que el visitante puede activar con un click."""

    label: str = Field(..., description='Texto visible del botón/chip, ej. "See all projects".')
    action: ActionType = Field(..., description="Qué debe hacer el frontend al activarla.")
    payload: str = Field(
        ...,
        description=(
            "Dato asociado a la acción: la pregunta a reenviar al agente (ask), "
            "la URL a abrir (link), o el medio de contacto a resaltar (contact)."
        ),
    )


class AgentResponse(BaseModel):
    """Respuesta estructurada del agente. Es el contrato completo entre backend y frontend."""

    language: Literal["es", "en"] = Field(
        ...,
        description=(
            "Language of the visitor question: 'en' or 'es'. "
            "All visitor-facing strings (title, summary, widget titles, item text, "
            "suggested_actions) MUST be written in this language."
        ),
    )
    title: str = Field(..., description="Encabezado corto de la respuesta, ej. \"Diego's AI experience\".")
    summary: str = Field(
        ...,
        description=(
            "La respuesta conversacional en sí, en texto plano (sin markdown). "
            "Siempre debe tener sentido por sí sola, aunque `widgets` esté vacío."
        ),
    )
    widgets: list[Widget] = Field(default_factory=list, description="Bloques visuales opcionales que amplían la respuesta.")
    suggested_actions: list[SuggestedAction] = Field(
        default_factory=list, description="Próximos pasos sugeridos para el visitante."
    )
