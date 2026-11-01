"""La instrumentación de latencia y tokens no depende de la red."""

import asyncio
import json

from langchain_core.messages import AIMessage

from app.ai.gemini_agent import generate_with_events
from app.schemas.agent_response import AgentResponse


class _FakeModel:
    def __init__(self, answer: AgentResponse) -> None:
        self.answer = answer
        self.calls = 0

    def bind_tools(self, tools, **_kwargs):
        return self

    async def ainvoke(self, _messages):
        self.calls += 1
        usage = {"input_tokens": 11, "output_tokens": 3, "total_tokens": 14}
        if self.calls == 1:
            return AIMessage(
                content="",
                tool_calls=[{"name": "get_skills", "args": {}, "id": "call-1", "type": "tool_call"}],
                usage_metadata=usage,
            )
        return AIMessage(content=self.answer.model_dump_json(), usage_metadata=usage)


def test_generate_with_events_records_tokens_without_network(monkeypatch):
    answer = AgentResponse(
        language="es",
        title="Skills",
        summary="Diego programa en Python.",
        widgets=[],
        suggested_actions=[],
    )
    monkeypatch.setattr("app.ai.gemini_agent.get_chat_model", lambda _key="": _FakeModel(answer))
    metrics: list[dict] = []
    seen: list[str] = []

    result = asyncio.run(
        generate_with_events(
            "¿Qué skills tiene?",
            on_event=lambda event: seen.append(event["tool"]) if event.get("type") == "tool_call" else None,
            metrics=metrics,
        )
    )

    assert result.summary == "Diego programa en Python."
    assert seen == ["get_skills"]
    assert len(metrics) == 2
    assert metrics[0]["tools"] == ["get_skills"]
    assert metrics[1]["tools"] == []
    assert sum(item["total_tokens"] for item in metrics) == 28
    assert all(item["latency_ms"] >= 0 for item in metrics)
    json.dumps(metrics)
