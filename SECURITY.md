# Seguridad

Este proyecto es un **portfolio público**: el chat no requiere login y cualquier visitante puede hacer preguntas. Las medidas abajo acotan abuso y fugas accidentales, no sustituyen un producto multi-tenant con datos sensibles.

## Reportar un problema

Si encontrás una vulnerabilidad, escribí a **lala.dev.tech@gmail.com** con pasos para reproducir. Evitá publicar exploits en issues abiertos hasta tener respuesta.

## Secretos

- **`GEMINI_API_KEY`** y **`PHOENIX_API_KEY`** solo en variables de entorno del backend (Railway, `.env` local).
- Nunca commitear `.env`. Usar [`backend/.env.example`](backend/.env.example) como plantilla.
- El frontend solo expone **`PUBLIC_API_URL`** (build time). No poner claves en variables `PUBLIC_*`.

Si una clave pudo filtrarse (commit, log, captura), **rotarla** en Google AI Studio / Phoenix y actualizar el despliegue.

## API pública

| Control | Detalle |
|---|---|
| Rate limit | 10 solicitudes/min por IP en `/api/v1/chat` y `/chat/stream` |
| Entrada | Pregunta 1–500 caracteres; `thread_id` opcional en formato UUID |
| CORS | Orígenes explícitos vía `BACKEND_CORS_ORIGINS` |
| Errores | Respuestas HTTP/SSE genéricas al cliente; detalle en logs del servidor |

No hay autenticación de visitantes. El **`thread_id`** identifica la sesión en el navegador (UUID en `localStorage`); no debe tratarse como secreto fuerte.

## Datos expuestos

- El asistente solo devuelve contenido del portfolio (JSON + corpus markdown acotado).
- [`backend/app/data/contact.json`](backend/app/data/contact.json) incluye email y teléfono a propósito (widget de contacto).

## Dependencias

Actualizar dependencias con el flujo habitual (`pip`, `npm audit`) antes de releases. No hay programa de bug bounty.
