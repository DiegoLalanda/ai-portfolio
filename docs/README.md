# Documentación

Documentación técnica del **AI Portfolio**. Para una visión general del proyecto y la puesta en marcha, empezá por el [README raíz](../README.md).

## Índice

| Documento | Contenido |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Grafo LangGraph, JSON + RAG, hilo SQLite, trazas OTLP/JSONL, SSE, contrato `AgentResponse`, rúbrica. |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Cloudflare Pages + Railway (API agentico, Phoenix opcional), variables y troubleshooting. |
| [../SECURITY.md](../SECURITY.md) | Secretos, límites del API público y contacto para reportes de seguridad. |

## Documentación relacionada (en el código)

| Documento | Contenido |
|---|---|
| [backend/README.md](../backend/README.md) | Estructura y puesta en marcha del backend FastAPI. |
| [frontend/README.md](../frontend/README.md) | Estructura y convenciones del frontend Astro. |
| [backend/app/data/README.md](../backend/app/data/README.md) | Forma de los archivos JSON de contenido del portfolio. |
| [backend/app/schemas/README.md](../backend/app/schemas/README.md) | Contrato de widgets entre backend y frontend. |
