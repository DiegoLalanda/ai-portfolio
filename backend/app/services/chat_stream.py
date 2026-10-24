"""Servicio de chat con streaming SSE."""

from collections.abc import AsyncIterator

import pydantic
from google.genai import errors as genai_errors

from app.ai.gemini_agent import TIMEOUT_MESSAGE, stream_answer_events
from app.core.config import settings
from app.graph.builder import NODE_NAME, get_portfolio_graph
from app.prompts import SYSTEM_PROMPT
from app.services.chat_context import build_agent_prompt
from app.services.graph_session import prepare_graph_turn


def _agent_output(event: dict) -> dict | None:
    if event.get("event") != "on_chain_end":
        return None
    metadata = event.get("metadata") or {}
    if metadata.get("langgraph_node") != NODE_NAME or event.get("name") != NODE_NAME:
        return None
    output = (event.get("data") or {}).get("output")
    if not isinstance(output, dict) or "response" not in output:
        return None
    return output["response"]


async def _stream_graph(graph_input: dict, config: dict) -> AsyncIterator[dict]:
    yield {"type": "started"}
    graph = get_portfolio_graph()
    sent_done = False
    try:
        async for event in graph.astream_events(
            graph_input,
            config=config,
            version="v2",
        ):
            if event.get("event") == "on_custom_event" and event.get("name") == "portfolio":
                payload = event.get("data")
                if isinstance(payload, dict):
                    yield payload
                continue
            response = _agent_output(event)
            if response is not None and not sent_done:
                sent_done = True
                yield {"type": "done", "response": response}
    except TimeoutError:
        yield {"type": "error", "message": TIMEOUT_MESSAGE}
    except genai_errors.APIError as error:
        yield {"type": "error", "message": f"Gemini API error: {error}"}
    except pydantic.ValidationError as error:
        yield {"type": "error", "message": f"Gemini devolvió una respuesta inválida: {error}"}
    except Exception as error:  # noqa: BLE001 — el cliente SSE recibe el mensaje
        yield {"type": "error", "message": str(error)}


async def stream_chat_events(
    question: str,
    *,
    shown_widget_types: list[str] | None = None,
    prior_questions: list[str] | None = None,
    thread_id: str | None = None,
) -> AsyncIterator[dict]:
    if settings.GRAPH_ENGINE == "langgraph":
        _prompt, config, graph_input = await prepare_graph_turn(
            question,
            shown_widget_types=shown_widget_types,
            prior_questions=prior_questions,
            thread_id=thread_id,
        )
        async for event in _stream_graph(graph_input, config):
            yield event
        return

    prompt = build_agent_prompt(
        question,
        shown_widget_types=shown_widget_types,
        prior_questions=prior_questions,
    )
    async for event in stream_answer_events(prompt, system_instruction=SYSTEM_PROMPT):
        yield event
