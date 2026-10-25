# Arquitectura

Este documento explica cómo funciona el portfolio conversacional por dentro: el flujo de una pregunta desde el navegador hasta el dashboard renderizado.

## Visión general

```
Frontend (Astro + React Islands)          Backend (FastAPI + Gemini)
──────────────────────────────            ───────────────────────────
AgentResponseIsland                        POST /api/v1/chat/stream
   │  streamChatMessage()                     │
   │  (fetch SSE)                             ▼
   └───────────────────────────────▶  stream_chat_events()
                                              │
                                              ▼
                                       gemini_agent.generate_with_events()
                                              │  loop de function calling
                                              ▼
                                       tools/get_*.py  ──▶  app/data/*.json
                                              │
                                              ▼
                                       AgentResponse (JSON estructurado)
   ◀───────────────── evento SSE "done" ──────┘
   │
   ▼
WidgetRenderer → widgetRegistry → componente React por widget.type
```

## Principios de diseño

- **Sin base de datos.** Todo el contenido del portfolio vive en JSON versionados en `backend/app/data/`. Editar el portfolio = editar un JSON.
- **Las tools son independientes.** Cada tool lee un único archivo y no depende de las demás. No hay embeddings ni RAG: es *function calling* directo sobre datos locales.
- **Contrato estructurado, no texto plano.** El agente devuelve un JSON (`AgentResponse`) que el frontend convierte en un dashboard. `title` + `summary` siempre existen (fallback textual); `widgets` es opcional.
- **Catálogo de widgets extensible.** Agregar un tipo de widget nuevo = sumarlo a `WidgetType` (backend) + crear su componente React y registrarlo (frontend). Los tipos desconocidos degradan a un fallback en vez de romper.

## Flujo detallado del agente

Archivo principal: `backend/app/ai/gemini_agent.py`.

1. **Entrada.** `stream_chat_events()` (en `app/services/chat_stream.py`) recibe la pregunta más el contexto de sesión (`shown_widget_types`, `prior_questions`) y arma el prompt con el system prompt de `app/prompts/system.py`.

2. **Loop de function calling manual** (`generate_with_events`, hasta `MAX_TOOL_TURNS = 12`):
   - Se llama a Gemini con la lista de `TOOLS` y `automatic_function_calling` **deshabilitado** (el loop lo maneja el backend, no el SDK).
   - Si la respuesta trae `function_call`s, el backend ejecuta cada tool (`_execute_tool`), emite eventos `tool_call` / `tool_done`, y le devuelve los resultados al modelo como `function_response`.
   - Se repite hasta que el modelo responde con texto en vez de pedir más tools.

3. **Respuesta estructurada.** El texto final se valida contra el JSON Schema de `AgentResponse` (`response_json_schema` + `response_mime_type="application/json"`). Si el modelo no devolvió un JSON válido en el loop, se hace una última llamada forzando el schema.

4. **Streaming SSE.** `stream_answer_events()` corre la generación en un worker thread (`asyncio.to_thread`) y encola eventos de progreso de forma *thread-safe*. Los eventos que llegan al frontend son:

   | Evento | Significado |
   |---|---|
   | `started` | Se abrió el stream |
   | `status` (`phase: thinking`) | El modelo está razonando |
   | `tool_call` (`tool: <nombre>`) | Se está ejecutando una tool |
   | `tool_done` (`tool: <nombre>`) | La tool terminó |
   | `status` (`phase: synthesizing`) | Armando la respuesta final |
   | `done` (`response: AgentResponse`) | Respuesta final lista |
   | `error` (`message`) | Falló algo |

## Endpoints

Definidos en `backend/app/api/v1/endpoints/chat.py`, bajo el prefijo `/api/v1`.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/chat` | Respuesta no-stream: devuelve `ChatResponse` (= `AgentResponse`) completo |
| `POST` | `/api/v1/chat/stream` | Respuesta por **SSE** con eventos de progreso (preferido por el frontend) |
| `GET` | `/health` | Health check (`{"status": "ok"}`) |
| `GET` | `/docs` | Swagger UI |

Ambos endpoints de chat aplican **rate limiting** (`app/core/rate_limiter.py`): 10 peticiones por minuto por IP, en memoria.

## Hilo de conversación (LangGraph)

Con `GRAPH_ENGINE=langgraph`, el visitante puede mandar un `thread_id` opcional. El frontend lo genera una vez, lo guarda en `localStorage` y lo reenvía en cada POST. El backend usa ese id como clave del **checkpointer** de LangGraph y acumula `session_questions` en el servidor (las últimas se inyectan en el prompt). Si no hay `thread_id`, cada request sigue siendo independiente y el contexto de preguntas previas depende de `prior_questions` en el body, como antes. `shown_widget_types` siempre viene del cliente.

Implementación: `AsyncSqliteSaver` en `CHECKPOINT_PATH` (por defecto `data/checkpoints.sqlite`), inicializado en el lifespan de FastAPI. Si el archivo no abre, el grafo cae a `MemorySaver` y el chat responde igual.

### Por qué SQLite y no Redis

La migración agentica del portfolio **no incluye Redis** como dependencia de producción. En el alcance del proyecto quedaron fuera colas, Pinecone, Redis como bus de respuestas y servicios extra de pago; el objetivo es **OSS y costo cero** con FastAPI en un solo proceso (Railway + Pages).

Para la fase de hilo solo hace falta **persistir el checkpoint de LangGraph** (preguntas de la sesión y estado del grafo), no una cola ni pub/sub:

| Criterio | SQLite (lo que usamos) | Redis |
|---|---|---|
| Infra | Un archivo en el mismo contenedor; `langgraph-checkpoint-sqlite` | Servicio aparte (URL, credenciales, red, costo o operación) |
| Caso actual | Una réplica del API; follow-ups en la misma visita | Brilla con **varias réplicas** del API compartiendo el mismo checkpointer |
| Desarrollo local | `python run.py` sin levantar nada más | Hay que tener Redis corriendo o mockearlo |
| Persistencia en Railway | El archivo vive en disco **efímero**: un **redeploy borra** el hilo | Un Redis **gestionado y persistente** sobrevive deploys y escala horizontal |

Elegimos SQLite porque encaja con “portfolio en un backend simple”: menos moving parts, tests offline con un path temporal, y el mismo patrón que el curso pero sin acoplar el sitio público a Redis. **No descartamos Redis para siempre**: tendría sentido si desplegáramos varias instancias del API o quisiéramos hilos que sobrevivan redeploys sin depender del disco del contenedor; eso sería una decisión de infra explícita, no un requisito de la fase 5.

## Trazas (OpenTelemetry)

Cada nodo del grafo (`router`, `bibliotecario`, `investigador`, `evidencia`, `compositor`) abre un span con `prompt.version` (env `PROMPT_VERSION`) y `langgraph.node`. LangChain queda instrumentado con OpenInference cuando el paquete está instalado.

**Local:** dejá `PHOENIX_COLLECTOR_ENDPOINT` vacío (o `TRACE_JSONL=true` en `.env`). Corré `python run.py` y hacé preguntas al chat; las líneas van a `backend/evidencia/trazas.jsonl` (gitignored). Los tests fuerzan JSONL en memoria + archivo.

**Producción — Phoenix en Railway (servicio aparte):** desplegá [Arize Phoenix con el template de Railway](https://railway.com/deploy/arize-phoenix-or-just-updated-llm-tracing-evals-data-survives-redeploys--arize-phoenix-or-just-updated-llm-tracin) en el **mismo proyecto** que el API. Ese servicio trae volumen en `/root/.phoenix` (las trazas de la UI **sobreviven redeploys** de Phoenix) y un dominio HTTPS donde conviven la UI y el colector OTLP/HTTP en `/v1/traces`.

Variables en el **servicio del backend** (FastAPI), no en Phoenix:

| Variable | Ejemplo |
|---|---|
| `PHOENIX_COLLECTOR_ENDPOINT` | `https://<phoenix>.up.railway.app/v1/traces` (acepta también la base sin `/v1/traces`) |
| `PHOENIX_PROJECT_NAME` | `ai-portfolio` |
| `GRAPH_ENGINE` | `langgraph` |
| `PHOENIX_API_KEY` | Solo si activaste auth en Phoenix (Bearer OTLP) |
| `TRACE_JSONL` | `false` (default con OTLP; el JSONL del API no persiste en Railway) |

En el **servicio Phoenix**, antes de tráfico real, considerá `PHOENIX_ENABLE_AUTH=true` y `PHOENIX_SECRET` (ver doc del template). El `PHOENIX_SECRET` no va en el API; si usás API keys de Phoenix, esa key sí va en `PHOENIX_API_KEY` del backend.

Al arrancar el API deberías ver en logs: `Trazas OTLP hacia https://...`. Abrí la UI en `https://<phoenix>.up.railway.app` y buscá el proyecto `PHOENIX_PROJECT_NAME`.

`/health` no depende de trazas ni de Phoenix.

### Request

```jsonc
{
  "question": "¿Qué proyectos de IA hiciste?",
  "shown_widget_types": ["projects"],   // widgets ya visibles en la sesión (para no repetir)
  "prior_questions": ["¿Quién es Diego?"], // historial en el body si no hay thread_id
  "thread_id": "550e8400-e29b-41d4-a716-446655440000" // opcional; hilo LangGraph en SQLite
}
```

## Contrato `AgentResponse`

Definido en `backend/app/schemas/agent_response.py` y espejado en `frontend/src/types/agent-response.ts`.

```jsonc
{
  "language": "es",                         // "es" | "en" — idioma de la pregunta
  "title": "Proyectos de IA de Diego",
  "summary": "Diego trabajó en...",          // texto plano, siempre presente
  "widgets": [
    {
      "id": "projects-ai",                   // único dentro de la respuesta (kebab-case)
      "type": "projects",                    // discriminador → componente React
      "title": "Proyectos destacados",
      "data": { "items": [ /* ... */ ] }      // payload libre según el tipo
    }
  ],
  "suggested_actions": [
    { "label": "Ver experiencia", "action": "ask", "payload": "¿Dónde trabajó Diego?" }
  ]
}
```

**Tipos de widget** (`WidgetType`): `text`, `timeline`, `skills`, `projects`, `technology-cloud`, `education`, `contact`, `experience`, `certifications`, `languages`, `soft-skills`.

**Acciones sugeridas** (`ActionType`): `ask` (reenvía una pregunta al agente), `link` (abre una URL), `contact` (resalta un medio de contacto).

## Tools y datos

Cada tool en `backend/app/tools/get_*.py` lee un JSON de `backend/app/data/`:

| Tool | Archivo de datos |
|---|---|
| `get_projects` | `projects.json` |
| `get_experience` | `experience.json` |
| `get_skills` | `skills.json` |
| `get_soft_skills` | `softskills.json` |
| `get_timeline` | `timeline.json` |
| `get_education` | `education.json` |
| `get_certifications` | `certifications.json` |
| `get_languages` | `languages.json` |
| `get_contact` | `contact.json` |

El SDK de Gemini arma el schema de cada tool a partir de su firma y docstring, así que **el docstring de cada tool es parte del prompt**: describir bien cuándo usarla mejora las decisiones del modelo.

La forma esperada de cada JSON está documentada en [`backend/app/data/README.md`](../backend/app/data/README.md).

## Frontend: del evento al widget

- `frontend/src/lib/api.ts` — `streamChatMessage()` parsea el stream SSE y emite eventos.
- `frontend/src/components/react/AgentResponseIsland.tsx` — isla React que dispara la pregunta y muestra el loading.
- `frontend/src/components/react/agent-response/widgetRegistry.ts` — mapea cada `widget.type` a su componente.
- `frontend/src/components/react/agent-response/WidgetRenderer.tsx` — recorre `widgets[]` y renderiza; los `type` desconocidos usan `FallbackWidget`.

## i18n

- Astro con `defaultLocale: "es"` y `locales: ["es", "en"]` (`astro.config.mjs`); el default no lleva prefijo, el inglés vive bajo `/en`.
- Diccionarios de UI en `frontend/src/i18n/{es,en}.ts`.
- La respuesta del agente se genera en el idioma de la pregunta (`AgentResponse.language`), independiente del locale de la UI.
