import asyncio

from langchain_core.messages import HumanMessage

from app.ai.gemini_client import gemini_api_keys
from app.graph.decision import RouterDecision
from app.llm.errors import is_retriable_capacity_error
from app.llm.provider import Completion, GenAIChatModel, acomplete, get_chat_model


def test_gemini_api_keys_deduplicates(monkeypatch):
    monkeypatch.setattr("app.ai.gemini_client.settings.GEMINI_API_KEY", "primary-key")
    monkeypatch.setattr("app.ai.gemini_client.settings.GEMINI_API_KEY_FALLBACK", "primary-key")
    assert gemini_api_keys() == ["primary-key"]


def test_gemini_api_keys_orders_primary_then_fallback(monkeypatch):
    monkeypatch.setattr("app.ai.gemini_client.settings.GEMINI_API_KEY", "key-a")
    monkeypatch.setattr("app.ai.gemini_client.settings.GEMINI_API_KEY_FALLBACK", "key-b")
    assert gemini_api_keys() == ["key-a", "key-b"]


def test_is_retriable_capacity_error_overloaded():
    assert is_retriable_capacity_error(RuntimeError("503 UNAVAILABLE model overloaded high demand"))


def test_acomplete_retries_with_fallback_key(monkeypatch):
    monkeypatch.setattr("app.llm.provider.gemini_api_keys", lambda: ["key-a", "key-b"])
    attempts: list[str] = []

    async def fake_acomplete_with_model(attempt_model, *args, **kwargs):
        attempts.append(attempt_model.api_key)
        if len(attempts) == 1:
            raise RuntimeError("429 RESOURCE_EXHAUSTED quota exceeded")
        return Completion(
            text='{"route":"direct","tools":[],"language":"es","retrieval_query":""}',
            tool_calls=[],
            latency_ms=1.0,
            prompt_tokens=1,
            output_tokens=1,
            total_tokens=2,
        )

    monkeypatch.setattr("app.llm.provider._acomplete_with_model", fake_acomplete_with_model)
    monkeypatch.setattr("app.llm.provider.get_chat_model", lambda key: GenAIChatModel(api_key=key))

    async def run():
        return await acomplete(
            GenAIChatModel(api_key="key-a"),
            [HumanMessage(content="hola")],
            mode="structured",
            timeout=5.0,
            schema=RouterDecision,
            call_site="test",
        )

    result = asyncio.run(run())
    assert result.total_tokens == 2
    assert attempts == ["key-a", "key-b"]


def test_acomplete_retries_fallback_on_timeout(monkeypatch):
    monkeypatch.setattr("app.llm.provider.gemini_api_keys", lambda: ["key-a", "key-b"])
    attempts: list[str] = []

    async def fake_acomplete_with_model(attempt_model, *args, **kwargs):
        attempts.append(attempt_model.api_key)
        if len(attempts) == 1:
            raise TimeoutError
        return Completion(
            text='{"route":"direct","tools":[],"language":"es","retrieval_query":""}',
            tool_calls=[],
            latency_ms=1.0,
            prompt_tokens=1,
            output_tokens=1,
            total_tokens=2,
        )

    monkeypatch.setattr("app.llm.provider._acomplete_with_model", fake_acomplete_with_model)
    monkeypatch.setattr("app.llm.provider.get_chat_model", lambda key: GenAIChatModel(api_key=key))

    async def run():
        return await acomplete(
            GenAIChatModel(api_key="key-a"),
            [HumanMessage(content="hola")],
            mode="structured",
            timeout=5.0,
            schema=RouterDecision,
            call_site="test",
        )

    result = asyncio.run(run())
    assert result.total_tokens == 2
    assert attempts == ["key-a", "key-b"]
