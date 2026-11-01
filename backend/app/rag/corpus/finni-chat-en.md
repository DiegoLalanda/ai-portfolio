# Finni chat delivery

project_id: proj-finni
lang: en

## Reply path

The public Finni record describes the chat as SSE streaming from the FastAPI backend. The assistant reply leaves through that stream while the model generates it. Redis is listed in the stack next to DynamoDB and S3. The record does not describe a Redis queue as the channel that returns the message. The documented reply path is the SSE stream, not a queued job the client polls later.

## Orchestration

Strands Agents coordinates tools, sub-agents and RAG on Amazon Bedrock Knowledge Bases. Diego works as an AI Developer on Finnegans' AI team. Finni is a company product, not a personal project.
