"""La instrumentación de latencia y tokens no depende de la red."""

import json

from app.ai.gemini_agent import generate_with_events
from app.schemas.agent_response import AgentResponse


class _Usage:
    prompt_token_count = 11
    candidates_token_count = 3
    total_token_count = 14


class _Call:
    def __init__(self, name: str) -> None:
        self.name = name
        self.args = {}


class _Part:
    def __init__(self, function_call=None) -> None:
        self.function_call = function_call


class _Content:
    def __init__(self, parts: list[_Part]) -> None:
        self.parts = parts


class _Candidate:
    def __init__(self, parts: list[_Part]) -> None:
        self.content = _Content(parts)


class _Response:
    def __init__(self, parts: list[_Part], text: str = "") -> None:
        self.candidates = [_Candidate(parts)]
        self.text = text
        self.usage_metadata = _Usage()


def test_generate_with_events_records_tokens_without_network(monkeypatch):
    answer = AgentResponse(
        language="es",
        title="Skills",
        summary="Diego programa en Python.",
        widgets=[],
        suggested_actions=[],
    )
    responses = [
        _Response([_Part(_Call("get_skills"))]),
        _Response([_Part()], text=answer.model_dump_json()),
    ]

    def fake_generate_content(**_kwargs):
        return responses.pop(0)

    monkeypatch.setattr(
        "app.ai.gemini_agent.client.models.generate_content",
        fake_generate_content,
    )
    metrics: list[dict] = []
    seen: list[str] = []

    result = generate_with_events(
        "¿Qué skills tiene?",
        on_event=lambda event: seen.append(event["tool"]) if event.get("type") == "tool_call" else None,
        metrics=metrics,
    )

    assert result.summary == "Diego programa en Python."
    assert seen == ["get_skills"]
    assert len(metrics) == 2
    assert metrics[0]["tools"] == ["get_skills"]
    assert metrics[1]["tools"] == []
    assert sum(item["total_tokens"] for item in metrics) == 28
    assert all(item["latency_ms"] >= 0 for item in metrics)
    json.dumps(metrics)
