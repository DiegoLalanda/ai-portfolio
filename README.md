# AI Portfolio

Portfolio personal **conversacional**: en lugar de secciones estáticas, el visitante le hace preguntas en lenguaje natural (ES/EN) a un asistente de IA que responde y arma un **dashboard visual dinámico** con widgets (proyectos, experiencia, skills, timeline, educación, certificaciones, contacto, etc.).

**Live:** [diegolalanda.pages.dev](https://diegolalanda.pages.dev/)

- **Frontend** — Astro 5 + React Islands + Tailwind, sitio estático desplegado en **Cloudflare Pages**.
- **Backend** — FastAPI + Google Gemini con *function calling*, desplegado en **Railway**.

---

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Cómo funciona el asistente](#cómo-funciona-el-asistente)
- [Estructura del monorepo](#estructura-del-monorepo)
- [Puesta en marcha local](#puesta-en-marcha-local)
- [Variables de entorno](#variables-de-entorno)
- [Despliegue](#despliegue)
- [Documentación](#documentación)

---

## Arquitectura

```
                    ┌─────────────────────────────┐
   Visitante  ─────▶│  Frontend (Astro + React)   │
   (browser)        │  Cloudflare Pages · estático │
                    └──────────────┬──────────────┘
                                   │  POST /api/v1/chat/stream (SSE)
                                   ▼
                    ┌─────────────────────────────┐
                    │   Backend (FastAPI)         │
                    │   Railway                   │
                    │                             │
                    │   ┌───────────────────────┐ │
                    │   │  Agente Gemini        │ │
                    │   │  function calling     │ │
                    │   └──────────┬────────────┘ │
                    │              │ tools         │
                    │              ▼               │
                    │   app/data/*.json (contenido)│
                    └─────────────────────────────┘
```

El backend **no usa base de datos**: todo el contenido del portfolio vive en archivos JSON versionados en `backend/app/data/`. El modelo llama a las *tools* que leen esos JSON y con eso arma la respuesta.

Para el detalle completo del flujo del agente, mirá [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Stack tecnológico

### Frontend
- [Astro 5](https://astro.build/) (output estático / SSG) con i18n `es` (default) + `en`
- [React 18](https://react.dev/) como *islands* para la interactividad puntual
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Motion](https://motion.dev/) para animaciones y [three.js](https://threejs.org/) para el fondo ambiental
- TypeScript en modo estricto (alias `@/*` → `src/*`)

### Backend
- [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/)
- [Pydantic v2](https://docs.pydantic.dev/) / `pydantic-settings` para config y contratos
- [google-genai](https://pypi.org/project/google-genai/) (SDK oficial de Google Gemini)
- Modelo: `gemini-3.1-flash-lite`
- Python 3.12+

### Infraestructura
- **Cloudflare Pages** — hosting del frontend estático + CDN global
- **Railway** — hosting del backend FastAPI

---

## Cómo funciona el asistente

1. El visitante escribe una pregunta (ej. *"¿Qué proyectos de IA hiciste?"*).
2. El frontend abre un stream **SSE** contra `POST /api/v1/chat/stream` y muestra el progreso en tiempo real (*thinking → tool_call → synthesizing*).
3. El backend ejecuta un loop de *function calling* **manual** (hasta 12 turnos): Gemini decide qué *tools* llamar, el backend las ejecuta contra los JSON y le devuelve los resultados.
4. Gemini produce una respuesta **estructurada** (`AgentResponse`: `title`, `summary`, `widgets[]`, `suggested_actions[]`) validada con Pydantic.
5. El frontend mapea cada `widget.type` a un componente React (`widgetRegistry.ts`) y renderiza el dashboard. Los tipos desconocidos caen a un *fallback* genérico.

**Tools disponibles** (una por dominio, todas leen un único JSON): `get_projects`, `get_experience`, `get_skills`, `get_soft_skills`, `get_timeline`, `get_education`, `get_certifications`, `get_languages`, `get_contact`.

---

## Estructura del monorepo

```
ai-portfolio/
├── frontend/          # Aplicación Astro + React Islands (Cloudflare Pages)
│   ├── src/
│   │   ├── components/   # ui/ (shadcn), layout/, sections/, react/ (islands)
│   │   ├── i18n/         # Diccionarios es/en
│   │   ├── lib/          # Cliente de API, helpers, efectos visuales
│   │   ├── pages/        # Routing file-based (es + /en)
│   │   └── types/        # Contratos compartidos con el backend
│   └── public/           # Estáticos (imágenes, CV en PDF)
├── backend/           # API FastAPI + agente Gemini (Railway)
│   ├── app/
│   │   ├── ai/           # Cliente y orquestador de Gemini
│   │   ├── api/v1/        # Routers y endpoints (/chat, /chat/stream)
│   │   ├── core/          # Config (Settings) y rate limiter
│   │   ├── data/          # Contenido del portfolio en JSON (fuente de verdad)
│   │   ├── prompts/       # System prompt del agente
│   │   ├── schemas/       # Contratos Pydantic (AgentResponse, ChatRequest)
│   │   ├── services/      # Orquestación de chat y streaming
│   │   └── tools/         # Funciones invocables por function calling
│   └── tests/            # Tests con pytest
├── docs/              # Documentación (arquitectura, despliegue)
└── README.md
```

---

## Puesta en marcha local

### Requisitos
- Node.js 20+
- Python 3.12+
- Una API key de Google Gemini ([Google AI Studio](https://aistudio.google.com/apikey))

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # y completar GEMINI_API_KEY
python run.py
```

API en `http://127.0.0.1:8000` · Swagger UI en `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env         # PUBLIC_API_URL apunta al backend
npm run dev
```

Sitio en `http://localhost:4321`.

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Default |
|---|---|---|
| `GEMINI_API_KEY` | API key de Google Gemini | *(vacío)* |
| `ENVIRONMENT` | `development` / `production` | `development` |
| `HOST` | Host donde escucha Uvicorn | `127.0.0.1` |
| `PORT` | Puerto de Uvicorn | `8000` |
| `RELOAD` | Auto-reload en desarrollo | `true` |
| `BACKEND_CORS_ORIGINS` | Orígenes permitidos por CORS (lista JSON) | `["http://localhost:4321"]` |

### Frontend (`frontend/.env`)

| Variable | Descripción | Default |
|---|---|---|
| `PUBLIC_API_URL` | URL base del backend FastAPI | `http://localhost:8000` |

> Las variables `PUBLIC_*` de Astro se inyectan en el bundle del cliente: no poner secretos ahí. La `GEMINI_API_KEY` vive **solo** en el backend.

---

## Despliegue

- **Frontend → Cloudflare Pages.** Build `npm run build`, directorio de salida `dist/`. Configurar `PUBLIC_API_URL` con la URL pública del backend.
- **Backend → Railway.** Start `python run.py` (lee `HOST`/`PORT` del entorno; Railway inyecta `PORT`). Configurar `GEMINI_API_KEY` y `BACKEND_CORS_ORIGINS` con el dominio de Cloudflare Pages.

Guía paso a paso en [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Documentación

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — flujo del agente, tools, contrato de widgets.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — despliegue en Cloudflare Pages y Railway.
- [`backend/app/data/README.md`](backend/app/data/README.md) — forma de los JSON de contenido.
- [`backend/app/schemas/README.md`](backend/app/schemas/README.md) — contrato de widgets.

---

Desarrollado por [Diego Javier Lalanda](https://www.linkedin.com/in/diego-lalanda-9576b21b8/) · [GitHub](https://github.com/DiegoLalanda)
