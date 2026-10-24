# Finni, entrega del chat

project_id: proj-finni
lang: es

## Camino de la respuesta

El registro público de Finni describe el chat como streaming SSE desde el backend FastAPI. La respuesta del asistente sale por ese stream mientras el modelo genera. Redis está en el stack junto a DynamoDB y S3. Ese registro no describe una cola de Redis como el canal que devuelve el mensaje. El camino documentado de la respuesta es el stream SSE, no un trabajo encolado que el cliente consulte después.

## Orquestación

Strands Agents coordina tools, sub-agentes y RAG sobre Knowledge Bases de Amazon Bedrock. Diego participa como AI Developer del equipo de IA de Finnegans. Finni es un producto de la empresa, no un proyecto personal.
