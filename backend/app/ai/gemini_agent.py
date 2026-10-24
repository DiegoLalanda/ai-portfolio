"""Generación con Gemini, function calling manual y eventos de progreso."""

from __future__ import annotations

import asyncio
import inspect
import json
import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any

import pydantic
from google.genai import errors as genai_errors
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage

from app.ai.gemini_client import TOOLS
from app.core.config import settings
from app.llm.provider import Completion, GenAIChatModel, acomplete, get_chat_model, model_was_rejected
from app.schemas.agent_response import AgentResponse

logger = logging.getLogger(__name__)

EventCallback = Callable[[dict[str, Any]], Awaitable[None] | None]


async def _emit(callback: EventCallback, event: dict[str, Any]) -> None:
    result = callback(event)
    if inspect.isawaitable(result):
        await result

MAX_TOOL_TURNS = 12
TOOL_MAP = {tool.__name__: tool for tool in TOOLS}
TIMEOUT_MESSAGE = "El modelo tardó demasiado."


def _execute_tool(name: str, args: dict[str, Any] | None) -> Any:
    tool = TOOL_MAP.get(name)
    if tool is None:
        return {"error": f"Unknown tool: {name}"}

    kwargs = dict(args) if args else {}
    return tool(**kwargs)


def _record_call(metrics: list[dict[str, Any]] | None, completion: Completion) -> None:
    if metrics is None:
        return
    metrics.append(
        {
            "latency_ms": round(completion.latency_ms, 1),
            "prompt_tokens": completion.prompt_tokens,
            "output_tokens": completion.output_tokens,
            "total_tokens": completion.total_tokens,
            "tools": [call["name"] for call in completion.tool_calls],
        }
    )


def _tool_message(name: str, call_id: str, result: Any) -> ToolMessage:
    return ToolMessage(
        content=json.dumps({"result": result}, ensure_ascii=False, default=str),
        tool_call_id=call_id,
        name=name,
    )


async def _complete(model, messages: list[BaseMessage], *, mode: str, timeout: float) -> tuple[Any, Completion]:
    try:
        completion = await acomplete(model, messages, mode=mode, timeout=timeout)  # type: ignore[arg-type]
    except Exception as error:
        if isinstance(model, GenAIChatModel) or not model_was_rejected(error):
            raise
        logger.info("El wrapper rechazó el modelo. Sigue el SDK de Gemini.")
        model = GenAIChatModel()
        completion = await acomplete(model, messages, mode=mode, timeout=timeout)  # type: ignore[arg-type]
    return model, completion


async def generate_with_events(
    prompt: str,
    system_instruction: str | None = None,
    on_event: EventCallback | None = None,
    metrics: list[dict[str, Any]] | None = None,
) -> AgentResponse:
    """Ejecuta el agente con tools manuales y emite eventos reales de progreso.

    `metrics` acumula latencia y tokens de cada llamada al modelo. No se envía
    por SSE: el contrato del front no cambia.
    """

    emit = on_event or (lambda _event: None)
    await _emit(emit, {"type": "status", "phase": "thinking"})

    messages: list[BaseMessage] = []
    if system_instruction:
        messages.append(SystemMessage(content=system_instruction))
    messages.append(HumanMessage(content=prompt))
    model = get_chat_model()

    for turn in range(MAX_TOOL_TURNS):
        # La primera vuelta elige tools. Las siguientes ya redactan con el JSON de la tool.
        timeout = settings.LLM_TIMEOUT_ROUTER_S if turn == 0 else settings.LLM_TIMEOUT_COMPOSER_S
        model, completion = await _complete(
            model,
            messages,
            mode="tools",
            timeout=timeout,
        )
        _record_call(metrics, completion)

        if completion.tool_calls:
            messages.append(
                AIMessage(
                    content=completion.text,
                    tool_calls=[
                        {"name": call["name"], "args": call["args"], "id": call["id"], "type": "tool_call"}
                        for call in completion.tool_calls
                    ],
                )
            )
            for call in completion.tool_calls:
                name = call["name"]
                logger.info("tool_call name=%s", name)
                await _emit(emit, {"type": "tool_call", "tool": name})
                result = _execute_tool(name, call["args"])
                await _emit(emit, {"type": "tool_done", "tool": name})
                messages.append(_tool_message(name, call["id"], result))
            continue

        if completion.text:
            try:
                parsed = AgentResponse.model_validate_json(completion.text)
            except pydantic.ValidationError:
                messages.append(AIMessage(content=completion.text))
                break
            else:
                await _emit(emit, {"type": "status", "phase": "synthesizing"})
                return parsed

        break

    await _emit(emit, {"type": "status", "phase": "synthesizing"})
    _model, final = await _complete(
        model,
        messages,
        mode="structured",
        timeout=settings.LLM_TIMEOUT_COMPOSER_S,
    )
    _record_call(metrics, final)
    if final.parsed is not None:
        return final.parsed
    return AgentResponse.model_validate_json(final.text)


async def stream_answer_events(
    prompt: str,
    system_instruction: str | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Async generator de eventos SSE para el frontend."""

    queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()

    def on_event(event: dict[str, Any]) -> None:
        queue.put_nowait(event)

    async def run_generation() -> None:
        try:
            result = await generate_with_events(prompt, system_instruction, on_event)
            await queue.put({"type": "done", "response": result.model_dump()})
        except TimeoutError:
            await queue.put({"type": "error", "message": TIMEOUT_MESSAGE})
        except genai_errors.APIError as error:
            await queue.put({"type": "error", "message": f"Gemini API error: {error}"})
        except pydantic.ValidationError as error:
            await queue.put(
                {
                    "type": "error",
                    "message": f"Gemini devolvió una respuesta inválida: {error}",
                }
            )
        except Exception as error:  # noqa: BLE001 — propagar mensaje al cliente SSE
            await queue.put({"type": "error", "message": str(error)})
        finally:
            await queue.put(None)

    yield {"type": "started"}

    task = asyncio.create_task(run_generation())
    while True:
        event = await queue.get()
        if event is None:
            break
        yield event

    await task
