# Despliegue

El proyecto se despliega en dos plataformas:

- **Frontend** → **Cloudflare Pages** (sitio estático + CDN global) — producción: [diegolalanda.pages.dev](https://diegolalanda.pages.dev/)
- **Backend** → **Railway** (API FastAPI)

El orden recomendado es **primero el backend** (para tener su URL pública) y **después el frontend** (que necesita esa URL en `PUBLIC_API_URL`).

> **Rama desplegada:** la arquitectura agentica (LangGraph, RAG, hilo, trazas) está en **`develop`**. Si Railway builda desde **`main`**, seguirás con el loop legacy hasta mergear y redeployar. Para producción agentica, desplegá **`develop`** (o merge a `main` cuando cierres el release).

---

## 1. Backend en Railway

### Configuración del servicio

- **Root directory:** `backend`
- **Start command:** `python run.py`

`run.py` levanta Uvicorn leyendo `HOST`, `PORT` y `RELOAD` desde `Settings` (que a su vez los toma del entorno). Railway inyecta la variable `PORT` automáticamente; hay que setear `HOST=0.0.0.0` para aceptar conexiones externas (el default `127.0.0.1` solo acepta conexiones locales y Railway marcaría el servicio como caído).

### Variables de entorno (Railway → Variables)

| Variable | Valor en producción |
|---|---|
| `GEMINI_API_KEY` | tu API key de Google Gemini |
| `HOST` | `0.0.0.0` |
| `ENVIRONMENT` | `production` |
| `RELOAD` | `false` |
| `BACKEND_CORS_ORIGINS` | `["https://diegolalanda.pages.dev"]` (lista JSON con el dominio del frontend) |
| `GRAPH_ENGINE` | `langgraph` (agentico en `develop`; omitir o `legacy` si aún no migraste) |
| `EMBEDDING_PROVIDER` | `gemini` |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` (o el id que acepte tu cuenta) |
| `CHECKPOINT_PATH` | `data/checkpoints.sqlite` (disco efímero: redeploy borra hilos del API) |
| `PHOENIX_COLLECTOR_ENDPOINT` | vacío si no usás Phoenix; si sí: `https://<phoenix>.up.railway.app/v1/traces` |
| `PHOENIX_PROJECT_NAME` | `ai-portfolio` |
| `PHOENIX_API_KEY` | solo si Phoenix tiene auth y emitís Bearer en OTLP |
| `TRACE_JSONL` | `false` con OTLP (no persiste en el contenedor) |
| `PROMPT_VERSION` | versión documentada del prompt (atributo de traza) |

Lista completa y comentarios: [`backend/.env.example`](../backend/.env.example).

> `PORT` lo provee Railway; no hace falta setearlo a mano.

> **Importante:** si `BACKEND_CORS_ORIGINS` no incluye el dominio exacto del frontend, el navegador bloqueará las peticiones por CORS. Incluir también dominios de preview de Cloudflare si querés que funcionen.

### 1.1 Phoenix en Railway (opcional, trazas)

Servicio **aparte** en el mismo proyecto Railway:

1. Desplegá [Arize Phoenix (template)](https://railway.com/deploy/arize-phoenix-or-just-updated-llm-tracing-evals-data-survives-redeploys--arize-phoenix-or-just-updated-llm-tracin). El template monta volumen en `/root/.phoenix` (historial de trazas en la UI sobrevive redeploys **de Phoenix**).
2. Dominio público HTTPS del servicio Phoenix → UI en `:6006` y colector OTLP en `/v1/traces`.
3. En el **servicio del API**, seteá `PHOENIX_COLLECTOR_ENDPOINT` con esa URL (ver tabla arriba).
4. Antes de tráfico real, en el servicio Phoenix: `PHOENIX_ENABLE_AUTH=true` y `PHOENIX_SECRET` (ver documentación del template). Las API keys de cliente van en `PHOENIX_API_KEY` del backend, no el secret del servidor Phoenix.

Al arrancar el API deberías ver en logs: `Trazas OTLP hacia https://...`.

### Verificación

- `https://<tu-backend>.up.railway.app/health` → `{"status": "ok"}`
- `https://<tu-backend>.up.railway.app/docs` → Swagger UI

---

## 2. Frontend en Cloudflare Pages

### Configuración del build

- **Root directory:** `frontend`
- **Framework preset:** Astro
- **Build command:** `npm run build`
- **Build output directory:** `dist`

Astro genera un sitio **estático** (`dist/`), que Cloudflare Pages sirve directamente desde su CDN.

### Variables de entorno (Cloudflare Pages → Settings → Environment variables)

| Variable | Valor en producción |
|---|---|
| `PUBLIC_API_URL` | `https://<tu-backend>.up.railway.app` |

> Las variables `PUBLIC_*` se inyectan en el bundle en **build time**. Si cambiás `PUBLIC_API_URL`, hay que **volver a buildear** (redeploy) para que tome efecto. Nunca poner secretos en variables `PUBLIC_*`: viajan al cliente.

### Verificación

- El sitio carga en el dominio de Pages.
- Al hacer una pregunta en el asistente, en la pestaña Network del navegador se ve el request a `/api/v1/chat/stream` contra la URL de Railway respondiendo `200` (y no un error de CORS).

---

## Checklist de un release

1. Rama desplegada en Railway alineada con lo que querés (`develop` = agentico).
2. `GEMINI_API_KEY` configurada en Railway (nunca en el repo).
3. `GRAPH_ENGINE=langgraph` si desplegás la migración agentica.
4. `BACKEND_CORS_ORIGINS` incluye el dominio de Cloudflare Pages.
5. `PUBLIC_API_URL` en Cloudflare apunta al backend de Railway y se hizo redeploy.
6. `/health` del backend responde OK.
7. El asistente responde en el sitio en producción sin errores de CORS.
8. (Opcional) Phoenix desplegado y `PHOENIX_COLLECTOR_ENDPOINT` en el API; una pregunta de prueba visible en la UI de Phoenix.

---

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| El chat no responde y la consola muestra error de CORS | El dominio del frontend no está en `BACKEND_CORS_ORIGINS` | Agregarlo (lista JSON) y redeploy del backend |
| El chat pega contra `localhost:8000` en producción | `PUBLIC_API_URL` no seteada o no se rebuildeó | Setear la variable en Cloudflare y redeploy |
| `429 Too Many Requests` | Rate limit (10 req/min por IP) | Esperar un minuto; ajustar en `app/core/rate_limiter.py` si hace falta |
| El backend arranca pero Railway lo marca como caído | Uvicorn escuchando en `127.0.0.1` | Setear `HOST=0.0.0.0` en Railway |
| `502` desde el frontend | El backend no pudo responder (API key inválida, cuota de Gemini) | Revisar logs de Railway y `GEMINI_API_KEY` |
