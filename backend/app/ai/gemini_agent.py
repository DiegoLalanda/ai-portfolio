"""Generación con Gemini, function calling manual y eventos de progreso."""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import AsyncIterator, Callable
from typing import Any

import pydantic
from google.genai import errors as genai_errors
from google.genai import types

from app.ai.gemini_client import MODEL, TOOLS, client
from app.schemas.agent_response import AgentResponse

logger = logging.getLogger(__name__)

EventCallback = Callable[[dict[str, Any]], None]

MAX_TOOL_TURNS = 12
TOOL_MAP = {tool.__name__: tool for tool in TOOLS}


def _tool_config(system_instruction: str | None) -> dict[str, Any]:
    # Dict config: el SDK de genai interpreta disable:True de forma fiable.
    return {
        "system_instruction": system_instruction,
        "tools": TOOLS,
        "automatic_function_calling": {
            "disable": True,
            "ignore_call_history": True,
        },
    }


def _structured_config(system_instruction: str | None) -> dict[str, Any]:
    return {
        "system_instruction": system_instruction,
        "response_mime_type": "application/json",
        "response_json_schema": AgentResponse.model_json_schema(),
        "automatic_function_calling": {"disable": True},
    }


def _token_counts(response: Any) -> tuple[int, int, int]:
    usage = getattr(response, "usage_metadata", None)
    if usage is None:
        return 0, 0, 0
    prompt = int(getattr(usage, "prompt_token_count", 0) or 0)
    output = int(getattr(usage, "candidates_token_count", 0) or 0)
    total = int(getattr(usage, "total_token_count", 0) or 0)
    if total == 0:
        total = prompt + output
    return prompt, output, total


def _record_call(
    metrics: list[dict[str, Any]] | None,
    response: Any,
    latency_ms: float,
    tools: list[str],
) -> None:
    if metrics is None:
        return
    prompt_tokens, output_tokens, total_tokens = _token_counts(response)
    metrics.append(
        {
            "latency_ms": round(latency_ms, 1),
            "prompt_tokens": prompt_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "tools": tools,
        }
    )


def _generate(model_contents: list[types.Content], config: dict[str, Any]) -> tuple[Any, float]:
    started = time.perf_counter()
    response = client.models.generate_content(
        model=MODEL,
        contents=model_contents,
        config=config,
    )
    return response, (time.perf_counter() - started) * 1000


def _execute_tool(name: str, args: dict[str, Any] | None) -> Any:
    tool = TOOL_MAP.get(name)
    if tool is None:
        return {"error": f"Unknown tool: {name}"}

    kwargs = dict(args) if args else {}
    return tool(**kwargs)


def generate_with_events(
    prompt: str,
    system_instruction: str | None = None,
    on_event: EventCallback | None = None,
    metrics: list[dict[str, Any]] | None = None,
) -> AgentResponse:
    """Ejecuta el agente con tools manuales y emite eventos reales de progreso.

    `metrics` acumula latencia y tokens de cada `generate_content`. No se envía
    por SSE: el contrato del front no cambia.
    """

    emit = on_event or (lambda _event: None)
    emit({"type": "status", "phase": "thinking"})

    contents: list[types.Content] = [
        types.Content(role="user", parts=[types.Part.from_text(text=prompt)]),
    ]

    for _turn in range(MAX_TOOL_TURNS):
        response, latency_ms = _generate(contents, _tool_config(system_instruction))

        if not response.candidates:
            _record_call(metrics, response, latency_ms, [])
            break

        candidate = response.candidates[0]
        if not candidate.content or not candidate.content.parts:
            _record_call(metrics, response, latency_ms, [])
            break

        function_calls = [part.function_call for part in candidate.content.parts if part.function_call]
        _record_call(
            metrics,
            response,
            latency_ms,
            [function_call.name or "unknown_tool" for function_call in function_calls],
        )
        if function_calls:
            contents.append(candidate.content)
            response_parts: list[types.Part] = []

            for function_call in function_calls:
                name = function_call.name or "unknown_tool"
                logger.info("tool_call name=%s", name)
                emit({"type": "tool_call", "tool": name})
                result = _execute_tool(name, function_call.args)
                emit({"type": "tool_done", "tool": name})
                response_parts.append(
                    types.Part.from_function_response(
                        name=name,
                        response={"result": result},
                    )
                )

            contents.append(types.Content(role="user", parts=response_parts))
            continue

        text = (response.text or "").strip()
        if text:
            try:
                parsed = AgentResponse.model_validate_json(text)
            except pydantic.ValidationError:
                contents.append(candidate.content)
                break
            else:
                emit({"type": "status", "phase": "synthesizing"})
                return parsed

        break

    emit({"type": "status", "phase": "synthesizing"})
    final, latency_ms = _generate(contents, _structured_config(system_instruction))
    _record_call(metrics, final, latency_ms, [])
    return AgentResponse.model_validate_json(final.text)


async def stream_answer_events(
    prompt: str,
    system_instruction: str | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Async generator de eventos SSE para el frontend."""

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()

    def on_event(event: dict[str, Any]) -> None:
        # generate_with_events corre en un worker thread: hay que encolar de forma thread-safe.
        loop.call_soon_threadsafe(queue.put_nowait, event)

    async def run_generation() -> None:
        try:
            result = await asyncio.to_thread(
                generate_with_events,
                prompt,
                system_instruction,
                on_event,
            )
            await queue.put({"type": "done", "response": result.model_dump()})
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
