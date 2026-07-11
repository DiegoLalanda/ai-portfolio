# Contrato de respuesta del agente

Este documento describe el catálogo de `widgets` soportados por `AgentResponse` (`agent_response.py`), el contrato JSON que devuelve `/chat` en vez de texto plano.

Ver el docstring de `agent_response.py` para la forma completa del contrato (`title`, `summary`, `widgets`, `suggested_actions`).

Cada `type` de esta tabla tiene un componente de React 1:1 en el frontend: `frontend/src/components/react/agent-response/widgets/`, registrado en `widgetRegistry.ts`. Si el frontend recibe un `type` que no está en ese registro, renderiza un fallback genérico en vez de romper (ver `FallbackWidget.tsx`).

## Catálogo de widgets

Cada widget es `{ id, type, title, data }`. La tabla describe qué se espera dentro de `data` para cada `type`. `data` queda modelado como un dict genérico a propósito: agregar un tipo nuevo es sumarlo acá, a `WidgetType` y crear su componente en el frontend, sin romper los que ya existen.

| `type` | `data` esperado | Pensado para |
|---|---|---|
| `text` | `{ "body": string }` | Texto adicional libre que no encaja en otro widget. |
| `experience` | `{ "items": [{ "id", "role", "company", "startDate", "endDate", "current", "summary", "highlights": string[], "stack": string[] }] }` (subconjunto de `experience.json`) | Preguntas sobre trayectoria laboral. |
| `projects` | `{ "displayGroup"?: "full-stack" | "ia" | "otras", "items"?: [...] }` — el frontend filtra el catálogo por `displayGroup`; omitirlo solo si preguntan por todos los proyectos. Llamar `get_projects(display_group=...)` con el mismo filtro. | Preguntas sobre proyectos concretos o el trabajo de Diego en general. |
| `skills` | `{ "categories": { [category: string]: string[] } }` — prefer keys `ai`, `cloud-devops`, `frontend`, `backend-data`, `design-cms-other`, `gamedev`; values = skill names from `skills.json`. For stack questions, include items across categories. | Preguntas sobre stack técnico, agrupado como en el CV. |
| `technology-cloud` | `{ "items": string[] }` | Listado plano de tecnologías (tag cloud), ej. el stack usado en un proyecto puntual. |
| `education` | `{ "items": [{ "id", "institution", "degree", "fieldOfStudy", "startDate", "endDate", "status", "highlights": string[] }] }` (subconjunto de `education.json`) | Preguntas sobre títulos y formación. |
| `contact` | `{ "email", "phone", "location", "links": [{ "label", "url", "type" }] }` (subconjunto de `contact.json`) | Preguntas sobre cómo contactar a Diego. |
| `timeline` | `{ "items": [{ "id", "date", "endDate", "type", "title", "description", "icon" }] }` (subconjunto de `timeline.json`) | Preguntas sobre la trayectoria completa en orden cronológico. |

## Convenciones

- `id` de cada widget: kebab-case, único dentro de la respuesta (no global), ej. `"experience-finnegans"`.
- Los `items`/`categories`/`links` dentro de `data` deben salir siempre de una tool (`app/tools/`), nunca inventados por el modelo — misma regla de grounding que ya rige el resto del agente (ver `app/prompts/system.py`).
- Si una pregunta no amerita ningún widget, `widgets` puede quedar como `[]`; `summary` siempre alcanza para responder por sí sola.
- `suggested_actions.action`: use `"ask"` only. The frontend reenvía `payload` como pregunta al agente. No uses `"link"` ni `"contact"` en sugerencias del dashboard.

## Cómo agregar un widget nuevo

1. Sumar el nombre a `WidgetType` en `agent_response.py`.
2. Agregar una fila a la tabla de arriba con la forma de `data`.
3. Actualizar `app/prompts/system.py` (sección `OUTPUT FORMAT`) para que el modelo sepa cuándo usarlo.
4. Crear el componente de React correspondiente en `frontend/src/components/react/agent-response/widgets/` y registrarlo en `widgetRegistry.ts`. Hasta que eso exista, el frontend lo renderiza con el fallback genérico sin romper nada.
