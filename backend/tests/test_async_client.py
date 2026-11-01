"""El request es async: timeout a SSE error, sin `asyncio.to_thread`."""

import asyncio

import pytest
from langchain_core.messages import AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.ai.gemini_agent import TIMEOUT_MESSAGE, stream_answer_events
from app.ai.gemini_client import chat_model_id
from app.llm.provider import GenAIChatModel, get_chat_model
from app.schemas.agent_response import AgentResponse


class _Slow:
    async def ainvoke(self, _messages):
        await asyncio.sleep(0.2)


class _Ready:
    def __init__(self, payload: str) -> None:
        self.payload = payload

    async def ainvoke(self, _messages):
        return AIMessage(
            content=self.payload,
            usage_metadata={"input_tokens": 2, "output_tokens": 1, "total_tokens": 3},
        )


def test_get_chat_model_uses_langchain_wrapper():
    model = get_chat_model("test-primary-key")
    assert isinstance(model, ChatGoogleGenerativeAI)
    assert chat_model_id() in model.model.replace("models/", "")


def test_get_chat_model_falls_back_when_the_wrapper_rejects_the_id(monkeypatch):
    class Rejected(ChatGoogleGenerativeAI):
        def __init__(self, **_kwargs):
            raise ValueError("model gemini-3.1-flash-lite is not supported")

    monkeypatch.setattr("app.llm.provider.ChatGoogleGenerativeAI", Rejected)
    assert isinstance(get_chat_model("test-key"), GenAIChatModel)


def test_timeout_becomes_sse_error(monkeypatch):
    monkeypatch.setattr("app.ai.gemini_agent.settings.LLM_TIMEOUT_ROUTER_S", 0.05)

    class _Model:
        def bind_tools(self, _tools, **_kwargs):
            return _Slow()

    monkeypatch.setattr("app.ai.gemini_agent.get_chat_model", lambda _key="": _Model())

    async def collect():
        return [event async for event in stream_answer_events("hola")]

    events = asyncio.run(collect())
    assert events[0] == {"type": "started"}
    assert events[1] == {"type": "status", "phase": "thinking"}
    assert {"type": "error", "message": TIMEOUT_MESSAGE} in events


def test_request_does_not_use_to_thread(monkeypatch):
    answer = AgentResponse(
        language="es",
        title="Ok",
        summary="Listo.",
        widgets=[],
        suggested_actions=[],
    )

    async def fail_to_thread(*_args, **_kwargs):
        raise AssertionError("to_thread")

    monkeypatch.setattr(asyncio, "to_thread", fail_to_thread)

    class _Model:
        def bind_tools(self, _tools, **_kwargs):
            return _Ready(answer.model_dump_json())

    monkeypatch.setattr("app.ai.gemini_agent.get_chat_model", lambda _key="": _Model())

    async def collect():
        return [event async for event in stream_answer_events("hola")]

    events = asyncio.run(collect())
    assert events[-1]["type"] == "done"
    assert events[-1]["response"]["summary"] == "Listo."
    assert not any(event["type"] == "error" for event in events)


def test_get_answer_maps_timeout_to_service_error(monkeypatch):
    from app.services.chat import ChatServiceError, get_answer

    async def boom(*_args, **_kwargs):
        raise TimeoutError

    monkeypatch.setattr("app.services.chat.settings.GRAPH_ENGINE", "legacy")
    monkeypatch.setattr("app.services.chat.generate_async", boom)
    with pytest.raises(ChatServiceError, match="tardó demasiado"):
        asyncio.run(get_answer("hola"))


def test_generate_async_does_not_use_to_thread(monkeypatch):
    from app.ai.gemini import generate_async

    answer = AgentResponse(
        language="es",
        title="Ok",
        summary="Async.",
        widgets=[],
        suggested_actions=[],
    )

    async def fail_to_thread(*_args, **_kwargs):
        raise AssertionError("to_thread")

    monkeypatch.setattr(asyncio, "to_thread", fail_to_thread)

    class _Model:
        def bind_tools(self, _tools, **_kwargs):
            return _Ready(answer.model_dump_json())

    monkeypatch.setattr("app.ai.gemini_agent.get_chat_model", lambda _key="": _Model())
    result = asyncio.run(generate_async("hola"))
    assert result.summary == "Async."
