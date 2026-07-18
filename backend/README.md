# Backend — AI Portfolio API

API construida con **FastAPI** y **Python**.

## Estructura

```
backend/
├── app/
│   ├── ai/                    # Integración con Google Gemini (cliente/orquestador)
│   ├── prompts/                # Plantillas de prompts para la IA
│   ├── skills/                  # Capacidades/tareas concretas que puede resolver el asistente
│   ├── tools/                    # Definiciones de tools invocables por function calling
│   ├── data/                      # Contenido del portfolio en JSON local
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/           # Routers por recurso (chat.py: /chat y /chat/stream)
│   │       └── router.py            # Router agregador de la v1
│   ├── core/
│   │   └── config.py                 # Configuración y variables de entorno (Settings)
│   ├── models/                        # Modelos de dominio internos
│   ├── schemas/                        # Esquemas Pydantic (request/response)
│   ├── services/                        # Integraciones no relacionadas a IA
│   ├── utils/                            # Utilidades compartidas
│   └── main.py                            # Punto de entrada de la app FastAPI
├── tests/                                  # Tests
├── run.py                                   # Levanta uvicorn usando la configuración de .env
├── requirements.txt
├── .env.example
└── README.md
```

### Convenciones

- **`ai/`**: única puerta de entrada al modelo de Gemini. Nada fuera de esta carpeta debería importar el SDK de IA directamente.
- **`prompts/`**: texto/plantillas de prompts versionados como código, separados de la lógica en `ai/`.
- **`skills/`**: cada skill representa una capacidad de alto nivel del asistente (compone `ai/`, `prompts/`, `tools/` y `data/`).
- **`tools/`**: funciones que el modelo puede invocar (function calling), con su esquema de entrada/salida definido junto a la implementación.
- **`data/`**: fuente de verdad del contenido del portfolio en JSON. No hay base de datos por el momento.
- **`services/`**: integraciones genéricas que no sean de IA (se agregan a futuro si hacen falta).

## Configuración

### Variables de entorno

Copiar `.env.example` a `.env`:

```bash
copy .env.example .env
```

| Variable | Descripción | Default |
|---|---|---|
| `ENVIRONMENT` | Entorno de ejecución (`development` / `production`) | `development` |
| `HOST` | Host donde escucha uvicorn | `127.0.0.1` |
| `PORT` | Puerto donde escucha uvicorn | `8000` |
| `RELOAD` | Auto-reload en desarrollo | `true` |
| `BACKEND_CORS_ORIGINS` | Orígenes permitidos por CORS (lista JSON) | `["http://localhost:4321"]` |
| `GEMINI_API_KEY` | API key de Google Gemini | *(vacío)* |

Las variables se cargan mediante `pydantic-settings` en `app/core/config.py`.

## Puesta en marcha

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python run.py
```

Alternativa equivalente usando la CLI de uvicorn directamente:

```bash
uvicorn app.main:app --reload
```

La API queda disponible en `http://127.0.0.1:8000`:

- `GET /health` → chequeo de estado
- `GET /docs` → documentación interactiva (Swagger UI)

## Endpoints

Bajo el prefijo `/api/v1` (ver `app/api/v1/endpoints/chat.py`):

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/chat` | Respuesta estructurada completa (`AgentResponse`) |
| `POST` | `/api/v1/chat/stream` | Respuesta por **SSE** con eventos de progreso (tool calls incluidos) |

Ambos aplican rate limiting (10 req/min por IP, `app/core/rate_limiter.py`).

## Agente

El asistente usa **Google Gemini** (`gemini-3.1-flash-lite`) con *function calling*
manual sobre 9 tools (`app/tools/get_*.py`), cada una leyendo un JSON de
`app/data/`. La respuesta se valida contra el schema `AgentResponse`
(`app/schemas/agent_response.py`).

El flujo completo (loop de tools, eventos SSE, contrato de widgets) está
documentado en [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).
