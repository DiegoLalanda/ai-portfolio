# Portfolio, contrato del asistente

project_id: proj-ai-portfolio
lang: es

## Respuesta en streaming

El portfolio responde por SSE. El backend es FastAPI y el modelo es Gemini. El contrato es AgentResponse: título, resumen y widgets. El frontend en Astro y React arma el tablero de proyectos desde su catálogo. La tool de proyectos fundamenta el resumen y no tiene que copiar todas las fichas dentro del widget.

## Qué no está en el JSON

Las fichas JSON dicen qué se construyó. Estas notas dicen cómo se entrega la respuesta: un stream de eventos, no un párrafo suelto. Una pregunta de fechas o de skills se responde con las tools. Una pregunta de arquitectura puede citar este corpus.
