"""El grafo de un nodo repite el contrato del loop. No llama a Gemini."""

import asyncio

from langchain_core.messages import AIMessage
from langgraph.checkpoint.memory import MemorySaver

from app.graph.builder import build_portfolio_graph
from app.schemas.agent_response import AgentResponse
from app.services.chat_stream import stream_chat_events
from tests.test_golden_set import load_questions

_ROW: dict = {}


class _ParityModel:
    def __init__(self) -> None:
        self.calls = 0

    def bind_tools(self, _tools, **_kwargs):
        return self

    async def ainvoke(self, _messages):
        self.calls += 1
        usage = {"input_tokens": 1, "output_tokens": 1, "total_tokens": 2}
        row = _ROW
        if self.calls == 1 and row["expected_tools"]:
            return AIMessage(
                content="",
                tool_calls=[
                    {"name": name, "args": {}, "id": f"call-{name}", "type": "tool_call"}
                    for name in row["expected_tools"]
                ],
                usage_metadata=usage,
            )
        ids = row.get("allowed_ids") or [row["id"]]
        answer = AgentResponse(
            language=row["language"],
            title=row["id"],
            summary="Respuesta de paridad.",
            widgets=[{"id": item_id, "type": "text", "data": {}} for item_id in ids],
            suggested_actions=[],
        )
        return AIMessage(content=answer.model_dump_json(), usage_metadata=usage)


def test_portfolio_graph_compiles_with_memory_saver():
    graph = build_portfolio_graph()
    assert isinstance(graph.checkpointer, MemorySaver)
    assert "agent" in graph.nodes


def test_legacy_and_langgraph_match_on_the_golden_set(monkeypatch):
    monkeypatch.setattr("app.ai.gemini_agent.get_chat_model", lambda: _ParityModel())
    questions = load_questions()

    async def collect(engine: str, question: str) -> list[dict]:
        monkeypatch.setattr("app.services.chat_stream.settings.GRAPH_ENGINE", engine)
        return [event async for event in stream_chat_events(question)]

    async def run() -> None:
        for row in questions:
            _ROW.clear()
            _ROW.update(row)
            legacy = await collect("legacy", row["question"])
            graph = await collect("langgraph", row["question"])
            assert graph == legacy, row["id"]
            done = graph[-1]
            assert done["type"] == "done", row["id"]
            assert done["response"]["language"] == row["language"], row["id"]
            tools = [event["tool"] for event in graph if event["type"] == "tool_call"]
            assert tools == row["expected_tools"], row["id"]
            ids = [widget["id"] for widget in done["response"]["widgets"]]
            assert ids == (row.get("allowed_ids") or [row["id"]]), row["id"]
            assert not any(event["type"] == "error" for event in graph), row["id"]

    asyncio.run(run())
