"""Servicio de chat con streaming SSE."""

import logging
from collections.abc import AsyncIterator

import pydantic
from google.genai import errors as genai_errors

from app.ai.gemini_agent import TIMEOUT_MESSAGE, stream_answer_events
from app.core.config import settings
from app.graph.builder import NODE_NAME, get_portfolio_graph
from app.llm.errors import RATE_LIMIT_HINT, error_summary, is_retriable_capacity_error
from app.prompts import SYSTEM_PROMPT
from app.services.chat_context import build_agent_prompt
from app.services.graph_session import prepare_graph_turn

logger = logging.getLogger(__name__)

STREAM_CLIENT_ERROR = "No pudimos generar una respuesta. Intentá de nuevo en un momento."


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


def _thread_id(config: dict) -> str:
    configurable = config.get("configurable") or {}
    thread = configurable.get("thread_id")
    return str(thread) if thread else "-"


async def _stream_graph(graph_input: dict, config: dict, *, question: str) -> AsyncIterator[dict]:
    yield {"type": "started"}
    graph = get_portfolio_graph()
    sent_done = False
    thread_id = _thread_id(config)
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
        logger.warning(
            "LangGraph stream timeout thread_id=%s question_len=%d router_limit_s=%.0f composer_limit_s=%.0f",
            thread_id,
            len(question),
            settings.LLM_TIMEOUT_ROUTER_S,
            settings.LLM_TIMEOUT_COMPOSER_S,
        )
        yield {"type": "error", "message": TIMEOUT_MESSAGE}
    except genai_errors.APIError as error:
        logger.error(
            "Gemini API error en stream LangGraph thread_id=%s detail=%s",
            thread_id,
            error_summary(error),
            exc_info=True,
        )
        yield {"type": "error", "message": STREAM_CLIENT_ERROR}
    except pydantic.ValidationError as error:
        logger.error(
            "Respuesta inválida del compositor thread_id=%s detail=%s",
            thread_id,
            error_summary(error),
        )
        yield {"type": "error", "message": STREAM_CLIENT_ERROR}
    except Exception as error:
        if is_retriable_capacity_error(error):
            logger.warning(
                "Gemini rate limit en stream thread_id=%s detail=%s",
                thread_id,
                error_summary(error),
            )
            yield {"type": "error", "message": RATE_LIMIT_HINT}
            return
        logger.error(
            "Error inesperado en stream LangGraph thread_id=%s detail=%s",
            thread_id,
            error_summary(error),
            exc_info=True,
        )
        yield {"type": "error", "message": STREAM_CLIENT_ERROR}


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
        async for event in _stream_graph(graph_input, config, question=question):
            yield event
        return

    prompt = build_agent_prompt(
        question,
        shown_widget_types=shown_widget_types,
        prior_questions=prior_questions,
    )
    async for event in stream_answer_events(prompt, system_instruction=SYSTEM_PROMPT):
        yield event
