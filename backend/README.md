# Backend — AI Portfolio API

API construida con **FastAPI**, **LangGraph** y **Google Gemini**.

## Estructura

```
backend/
├── app/
│   ├── ai/                    # Cliente Gemini y loop legacy (GRAPH_ENGINE=legacy)
│   ├── graph/                 # LangGraph: builder, nodes, state, checkpointer
│   ├── rag/                   # Corpus markdown, BM25 + Chroma, hybrid retrieval
│   ├── observability/         # OpenTelemetry, export JSONL / OTLP
│   ├── eval/                  # GoldenEvalChatModel para rúbrica offline
│   ├── prompts/               # Plantillas (router, compositor, legacy)
│   ├── tools/                 # get_*.py — lectura de app/data/*.json
│   ├── data/                  # Contenido del portfolio (JSON)
│   ├── llm/                   # Provider LangChain / timeouts
│   ├── api/v1/
│   │   ├── endpoints/         # chat.py: /chat y /chat/stream
│   │   └── router.py
│   ├── core/                  # config.py, rate_limiter
│   ├── schemas/               # AgentResponse, ChatRequest, router decisions
│   ├── services/              # chat_stream, chat_context, graph_session
│   └── main.py                # Lifespan: RAG, checkpointer, tracing
├── tests/                     # pytest (offline + -m live)
├── evidencia/                 # trazas.jsonl, medicion.json (gitignored)
├── evaluar.py                 # Entrada rúbrica
├── run.py
├── requirements.txt
├── .env.example
└── README.md
```

### Convenciones

- **`graph/`**: motor por defecto (`GRAPH_ENGINE=langgraph`). Nodos instrumentados con `@trace_node`.
- **`ai/`**: loop legacy y utilidades Gemini; no importar el SDK fuera de `ai/` y `llm/` salvo casos ya existentes.
- **`tools/`**: funciones síncronas sobre JSON; el bibliotecario las invoca según la decisión del router.
- **`rag/`**: solo markdown en `rag/corpus/`; los JSON del portfolio **no** se indexan.
- **`data/`**: fuente de verdad del contenido; ver [`app/data/README.md`](app/data/README.md).

## Configuración

Copiar `.env.example` a `.env`:

```bash
copy .env.example .env
```

Variables principales:

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | Google Gemini (chat + embeddings RAG) |
| `GRAPH_ENGINE` | `langgraph` (default) o `legacy` |
| `EMBEDDING_PROVIDER` | `gemini` en dev/prod; `hash` en tests |
| `CHECKPOINT_PATH` | SQLite para hilos LangGraph |
| `PHOENIX_COLLECTOR_ENDPOINT` | OTLP; vacío → `evidencia/trazas.jsonl` |

Lista completa: [`.env.example`](.env.example). Carga vía `pydantic-settings` en `app/core/config.py`.

## Puesta en marcha

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python run.py
```

Alternativa: `uvicorn app.main:app --reload`

- `GET /health` — sin dependencia de Gemini/RAG/Phoenix
- `GET /docs` — Swagger

## Endpoints

Prefijo `/api/v1` (`app/api/v1/endpoints/chat.py`):

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/chat` | `AgentResponse` completo |
| `POST` | `/api/v1/chat/stream` | **SSE** (frontend) |

Rate limit: 10 req/min por IP (`app/core/rate_limiter.py`).

Body incluye opcional `thread_id` (ver `app/schemas/chat.py`).

## Agente

Motor **LangGraph**: router → bibliotecario / investigador → evidencia → compositor. Modelo `gemini-3.1-flash-lite`. Detalle en [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Rúbrica

```bash
python evaluar.py          # offline, sin GEMINI_API_KEY
python evaluar.py --live   # medición opt-in (pytest -m live)
```

Golden set: `tests/golden/preguntas.jsonl`. Modelo falso: `app/eval/golden_model.py`.
