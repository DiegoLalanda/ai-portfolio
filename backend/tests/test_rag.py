"""El corpus se busca en local. Las preguntas de hechos no embeddean."""

import asyncio

from langchain_core.messages import AIMessage

from app.core.config import settings
from app.graph.builder import build_portfolio_graph
from app.graph.decision import RouterDecision
from app.graph.nodes import investigador
from app.rag.hybrid import indice, load_chunks
from app.schemas.agent_response import AgentResponse


def setup_function() -> None:
    settings.EMBEDDING_PROVIDER = "hash"
    assert indice.cargar() >= 4
    assert indice.rag_ready is True


def test_chunks_come_from_markdown_only():
    chunks = load_chunks()
    assert 4 <= len({chunk.source for chunk in chunks}) <= 8
    assert all(chunk.source.endswith(".md") for chunk in chunks)
    assert all(chunk.project_id.startswith("proj-") for chunk in chunks)
    assert {chunk.lang for chunk in chunks} >= {"es", "en"}
    assert any(chunk.project_id == "proj-finni" and "SSE" in chunk.text for chunk in chunks)


def test_architecture_question_cites_finni_markdown():
    passages = indice.buscar("por qué el orquestador de Finni no usa una cola Redis para responder el chat")
    assert passages
    assert passages[0]["project_id"] == "proj-finni"
    assert passages[0]["source"].endswith(".md")
    assert "SSE" in passages[0]["text"]
    assert indice.query_embedding_latency_ms > 0


def test_facts_route_does_not_embed():
    calls = {"n": 0}

    def boom(_query: str):
        calls["n"] += 1
        raise AssertionError("buscar")

    original = indice.buscar
    indice.buscar = boom
    try:
        result = asyncio.run(
            investigador(
                {
                    "question": "¿Cuándo empezó Diego en Finnegans?",
                    "plan": {
                        "route": "facts",
                        "tools": ["get_experience"],
                        "language": "es",
                        "retrieval_query": "",
                    },
                },
                {},
            )
        )
    finally:
        indice.buscar = original
    assert calls["n"] == 0
    assert result["passages"] == []


class _NarrativeModel:
    def __init__(self) -> None:
        self.schema = None

    def with_structured_output(self, schema, **_kwargs):
        self.schema = schema
        return self

    async def ainvoke(self, _messages):
        usage = {"input_tokens": 3, "output_tokens": 2, "total_tokens": 5}
        raw = AIMessage(content="{}", usage_metadata=usage)
        if self.schema is RouterDecision:
            return {
                "raw": raw,
                "parsed": RouterDecision(
                    route="narrative",
                    tools=["get_projects"],
                    language="es",
                    retrieval_query="cola redis chat finni sse",
                ),
            }
        return {
            "raw": raw,
            "parsed": AgentResponse(
                language="es",
                title="Finni",
                summary="La respuesta documentada sale por SSE.",
                widgets=[{"id": "proj-finni", "type": "text", "data": {}}],
                suggested_actions=[],
            ),
        }


def test_narrative_route_retrieves_and_records_embedding_latency(monkeypatch):
    monkeypatch.setattr("app.graph.nodes.get_chat_model", lambda: _NarrativeModel())
    graph = build_portfolio_graph()
    state = asyncio.run(
        graph.ainvoke(
            {
                "question": "¿Por qué el orquestador de Finni no usa una cola Redis para responder el chat?",
                "attempts": 0,
                "passages": [],
                "messages": [],
            },
            config={"configurable": {"thread_id": "rag-narrative"}},
        )
    )
    assert state["passages"]
    assert state["passages"][0]["project_id"] == "proj-finni"
    embedding = [item for item in state["metrics"] if item.get("embedding_latency_ms")]
    assert embedding
    assert embedding[0]["embedding_tokens"] == 0
    chat_calls = [item for item in state["metrics"] if item["total_tokens"] >= 1]
    assert len(chat_calls) == 2


def test_index_failure_leaves_facts_path_ready(monkeypatch):
    def broken_client():
        raise RuntimeError("chroma")

    monkeypatch.setattr("app.rag.hybrid.chromadb.EphemeralClient", broken_client)
    assert indice.cargar() == 0
    assert indice.rag_ready is False
    result = asyncio.run(
        investigador(
            {
                "question": "arquitectura",
                "plan": {
                    "route": "narrative",
                    "tools": [],
                    "language": "es",
                    "retrieval_query": "finni",
                },
            },
            {},
        )
    )
    assert result["passages"] == []
    monkeypatch.undo()
    settings.EMBEDDING_PROVIDER = "hash"
    assert indice.cargar() >= 4
