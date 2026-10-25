"""Cliente de chat async. LangChain primero; el SDK de Gemini si ese wrapper rechaza el modelo."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from dataclasses import dataclass
from typing import Any, Literal

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, ValidationError

from functools import lru_cache

from app.ai.gemini_client import TOOLS, chat_model_id, gemini_api_keys, get_genai_client
from app.core.config import settings
from app.llm.errors import error_summary, is_retriable_capacity_error, log_llm_failure, log_llm_timeout
from app.schemas.agent_response import AgentResponse

logger = logging.getLogger(__name__)

Mode = Literal["tools", "structured"]


@dataclass
class Completion:
    text: str
    tool_calls: list[dict[str, Any]]
    latency_ms: float
    prompt_tokens: int
    output_tokens: int
    total_tokens: int
    parsed: BaseModel | None = None


class GenAIChatModel(BaseChatModel):
    """Llama al SDK de Gemini cuando ChatGoogleGenerativeAI no acepta el id del modelo."""

    api_key: str = ""

    @property
    def _llm_type(self) -> str:
        return "portfolio-genai"

    def _generate(self, messages: list[BaseMessage], stop: list[str] | None = None, run_manager: Any = None, **kwargs: Any):
        raise NotImplementedError("El cliente de respaldo es async. Usar ainvoke.")

    async def _agenerate(self, messages: list[BaseMessage], stop: list[str] | None = None, run_manager: Any = None, **kwargs: Any):
        from langchain_core.outputs import ChatGeneration, ChatResult

        completion = await self.acomplete(
            messages,
            mode=kwargs.get("mode", "tools"),
            timeout=float(kwargs.get("timeout", settings.LLM_TIMEOUT_COMPOSER_S)),
        )
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=completion.text))])

    async def acomplete(
        self,
        messages: list[BaseMessage],
        *,
        mode: Mode,
        timeout: float,
        schema: type[BaseModel] | None = None,
    ) -> Completion:
        target = schema or AgentResponse
        system, contents = _to_genai(messages)
        config: dict[str, Any] = {
            "system_instruction": system,
            "automatic_function_calling": {"disable": True, "ignore_call_history": True},
        }
        if mode == "tools":
            config["tools"] = TOOLS
        else:
            config["response_mime_type"] = "application/json"
            config["response_json_schema"] = target.model_json_schema()

        genai_client = get_genai_client(self.api_key)
        started = time.perf_counter()
        async with asyncio.timeout(timeout):
            response = await genai_client.aio.models.generate_content(
                model=chat_model_id(),
                contents=contents,
                config=config,
            )
        latency_ms = (time.perf_counter() - started) * 1000
        prompt_tokens, output_tokens, total_tokens = _usage_from_genai(response)
        tool_calls = _tool_calls_from_genai(response) if mode == "tools" else []
        text = (getattr(response, "text", None) or "").strip()
        parsed = None
        if mode == "structured" and text:
            try:
                parsed = target.model_validate_json(text)
            except ValidationError:
                parsed = None
        return Completion(
            text=text,
            tool_calls=tool_calls,
            latency_ms=latency_ms,
            prompt_tokens=prompt_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            parsed=parsed,
        )


@lru_cache(maxsize=4)
def get_chat_model(api_key: str) -> BaseChatModel:
    """Chat model LangChain o SDK de respaldo para una API key concreta."""

    model_id = chat_model_id()
    key = api_key.strip()
    try:
        return ChatGoogleGenerativeAI(
            model=model_id,
            google_api_key=key or None,
            max_retries=0,
        )
    except (ImportError, ValueError, TypeError, ValidationError) as error:
        logger.info("ChatGoogleGenerativeAI no acepta %s: %s", model_id, error)
        return GenAIChatModel(api_key=key)


async def _acomplete_with_model(
    model: BaseChatModel,
    messages: list[BaseMessage],
    *,
    mode: Mode,
    timeout: float,
    schema: type[BaseModel],
) -> Completion:
    if isinstance(model, GenAIChatModel):
        return await model.acomplete(messages, mode=mode, timeout=timeout, schema=schema)
    return await _complete_langchain(model, messages, mode=mode, timeout=timeout, schema=schema)


async def acomplete(
    model: BaseChatModel,
    messages: list[BaseMessage],
    *,
    mode: Mode,
    timeout: float,
    schema: type[BaseModel] | None = None,
    call_site: str = "",
) -> Completion:
    target = schema or AgentResponse
    keys = gemini_api_keys()
    attempts: list[BaseChatModel] = [model]
    for api_key in keys[1:]:
        attempts.append(get_chat_model(api_key))

    last_error: Exception | None = None
    for index, attempt_model in enumerate(attempts):
        try:
            return await _acomplete_with_model(
                attempt_model,
                messages,
                mode=mode,
                timeout=timeout,
                schema=target,
            )
        except TimeoutError as error:
            last_error = error
            log_llm_timeout(call_site=call_site, mode=mode, limit_s=timeout)
            if index < len(attempts) - 1:
                logger.warning(
                    "Gemini intento %s/%s timeout en %s; probando API key fallback",
                    index + 1,
                    len(attempts),
                    call_site or "unknown",
                )
                continue
            raise
        except Exception as error:
            last_error = error
            if index < len(attempts) - 1 and is_retriable_capacity_error(error):
                logger.warning(
                    "Gemini intento %s/%s falló en %s (%s); probando API key fallback",
                    index + 1,
                    len(attempts),
                    call_site or "unknown",
                    error_summary(error),
                )
                continue
            log_llm_failure(error, call_site=call_site, mode=mode, limit_s=timeout)
            raise

    if last_error is not None:
        raise last_error
    raise ValueError("GEMINI_API_KEY no configurada")


def model_was_rejected(error: Exception) -> bool:
    text = str(error).casefold()
    return "not found" in text or "not supported" in text or "invalid model" in text or "is not found" in text


async def _complete_langchain(
    model: BaseChatModel,
    messages: list[BaseMessage],
    *,
    mode: Mode,
    timeout: float,
    schema: type[BaseModel],
) -> Completion:
    if mode == "tools":
        runnable = model.bind_tools(TOOLS)
    else:
        runnable = model.with_structured_output(schema, method="json_schema", include_raw=True)

    started = time.perf_counter()
    async with asyncio.timeout(timeout):
        result = await runnable.ainvoke(messages)
    latency_ms = (time.perf_counter() - started) * 1000

    if mode == "structured":
        if isinstance(result, dict):
            raw = result.get("raw")
            parsed = result.get("parsed")
        else:
            raw = result
            parsed = result if isinstance(result, schema) else None
        if not isinstance(parsed, schema):
            parsed = None
        text = parsed.model_dump_json() if isinstance(parsed, BaseModel) else _message_text(raw)
        prompt_tokens, output_tokens, total_tokens = _usage_from_message(raw)
        return Completion(
            text=text,
            tool_calls=[],
            latency_ms=latency_ms,
            prompt_tokens=prompt_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            parsed=parsed,
        )

    prompt_tokens, output_tokens, total_tokens = _usage_from_message(result)
    return Completion(
        text=_message_text(result),
        tool_calls=_tool_calls_from_message(result),
        latency_ms=latency_ms,
        prompt_tokens=prompt_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
    )


def _message_text(message: Any) -> str:
    content = getattr(message, "content", "")
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        chunks: list[str] = []
        for block in content:
            if isinstance(block, str):
                chunks.append(block)
            elif isinstance(block, dict) and block.get("type") == "text":
                chunks.append(str(block.get("text") or ""))
        return "".join(chunks).strip()
    return str(content or "").strip()


def _usage_from_message(message: Any) -> tuple[int, int, int]:
    usage = getattr(message, "usage_metadata", None) or {}
    if not isinstance(usage, dict):
        usage = {
            "input_tokens": getattr(usage, "input_tokens", 0),
            "output_tokens": getattr(usage, "output_tokens", 0),
            "total_tokens": getattr(usage, "total_tokens", 0),
        }
    prompt = int(usage.get("input_tokens") or usage.get("prompt_token_count") or 0)
    output = int(usage.get("output_tokens") or usage.get("candidates_token_count") or 0)
    total = int(usage.get("total_tokens") or usage.get("total_token_count") or 0)
    if total == 0:
        total = prompt + output
    return prompt, output, total


def _usage_from_genai(response: Any) -> tuple[int, int, int]:
    usage = getattr(response, "usage_metadata", None)
    if usage is None:
        return 0, 0, 0
    prompt = int(getattr(usage, "prompt_token_count", 0) or 0)
    output = int(getattr(usage, "candidates_token_count", 0) or 0)
    total = int(getattr(usage, "total_token_count", 0) or 0)
    if total == 0:
        total = prompt + output
    return prompt, output, total


def _tool_calls_from_message(message: Any) -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []
    for call in getattr(message, "tool_calls", None) or []:
        name = call.get("name") or "unknown_tool"
        args = call.get("args") or {}
        calls.append({"name": name, "args": args if isinstance(args, dict) else {}, "id": call.get("id") or name})
    return calls


def _tool_calls_from_genai(response: Any) -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []
    for candidate in getattr(response, "candidates", None) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", None) or []:
            function_call = getattr(part, "function_call", None)
            if not function_call:
                continue
            name = function_call.name or "unknown_tool"
            args = function_call.args or {}
            calls.append({"name": name, "args": dict(args), "id": name})
    return calls


def _to_genai(messages: list[BaseMessage]) -> tuple[str | None, list[Any]]:
    from google.genai import types

    system: str | None = None
    contents: list[Any] = []
    for message in messages:
        if isinstance(message, SystemMessage):
            system = str(message.content)
            continue
        if isinstance(message, HumanMessage):
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=str(message.content))]))
            continue
        if isinstance(message, AIMessage):
            parts: list[Any] = []
            text = _message_text(message)
            if text:
                parts.append(types.Part.from_text(text=text))
            for call in message.tool_calls or []:
                parts.append(types.Part.from_function_call(name=call["name"], args=call.get("args") or {}))
            if parts:
                contents.append(types.Content(role="model", parts=parts))
            continue
        if isinstance(message, ToolMessage):
            payload = _tool_payload(str(message.content))
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_function_response(name=message.name or "unknown_tool", response=payload)],
                )
            )
    return system, contents


def _tool_payload(content: str) -> dict[str, Any]:
    try:
        payload = json.loads(content)
    except json.JSONDecodeError:
        return {"result": content}
    if isinstance(payload, dict):
        return payload
    return {"result": payload}
