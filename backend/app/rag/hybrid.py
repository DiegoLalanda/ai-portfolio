"""Recuperación híbrida del corpus markdown. Chroma en memoria y BM25, unidos con RRF."""

from __future__ import annotations

import hashlib
import logging
import os
import re
import time
from dataclasses import dataclass
from pathlib import Path

os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

import chromadb
from chromadb.api.types import EmbeddingFunction
from rank_bm25 import BM25Okapi

from app.core.config import settings

logger = logging.getLogger(__name__)

_DIM = 64
_RRF_K = 60
_TOKEN = re.compile(r"[a-záéíóúüñ0-9]+", re.IGNORECASE)
_CORPUS = Path(__file__).parent / "corpus"
_PROJECT = re.compile(r"^project_id:\s*(\S+)\s*$", re.MULTILINE)
_LANG = re.compile(r"^lang:\s*(\S+)\s*$", re.MULTILINE)
_FALLBACK_MODEL = "text-embedding-004"


@dataclass(frozen=True)
class Chunk:
    id: str
    text: str
    project_id: str
    lang: str
    source: str


def load_chunks() -> list[Chunk]:
    if not _CORPUS.is_dir():
        return []
    chunks: list[Chunk] = []
    for path in sorted(_CORPUS.glob("*.md")):
        raw = path.read_text(encoding="utf-8")
        project_id = _PROJECT.search(raw).group(1) if _PROJECT.search(raw) else ""
        lang = _LANG.search(raw).group(1) if _LANG.search(raw) else "es"
        for section in re.split(r"(?m)^## ", raw)[1:]:
            lines = section.splitlines()
            heading = lines[0].strip()
            body = "\n".join(lines[1:]).strip()
            if not heading or not body:
                continue
            chunks.append(
                Chunk(
                    id=f"{path.stem}:{heading}",
                    text=f"{heading}\n{body}",
                    project_id=project_id,
                    lang=lang,
                    source=path.name,
                )
            )
    return chunks


def _tokens(text: str) -> list[str]:
    return [token.casefold() for token in _TOKEN.findall(text)]


def _hash_vector(text: str) -> list[float]:
    vector = [0.0] * _DIM
    tokens = _tokens(text)
    if not tokens:
        return vector
    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        vector[int.from_bytes(digest[:4], "little") % _DIM] += 1.0
    norm = sum(value * value for value in vector) ** 0.5 or 1.0
    return [value / norm for value in vector]


def _rrf(*rankings: list[str]) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}
    for ranking in rankings:
        for position, item_id in enumerate(ranking):
            scores[item_id] = scores.get(item_id, 0.0) + 1.0 / (_RRF_K + position + 1)
    return sorted(scores.items(), key=lambda item: item[1], reverse=True)


class HashEmbedding(EmbeddingFunction):
    def __init__(self) -> None:
        pass

    @staticmethod
    def name() -> str:
        return "hash"

    def get_config(self) -> dict[str, str]:
        return {"provider": "hash"}

    @staticmethod
    def build_from_config(config: dict) -> HashEmbedding:
        del config
        return HashEmbedding()

    def __call__(self, input: list[str]) -> list[list[float]]:
        return [_hash_vector(text) for text in input]


class GeminiEmbedding(EmbeddingFunction):
    def __init__(self, owner: Indice) -> None:
        self.owner = owner

    @staticmethod
    def name() -> str:
        return "gemini"

    def get_config(self) -> dict[str, str]:
        return {"provider": "gemini"}

    @staticmethod
    def build_from_config(config: dict) -> GeminiEmbedding:
        del config
        return GeminiEmbedding(indice)

    def __call__(self, input: list[str]) -> list[list[float]]:
        vectors, tokens = _embed_gemini(list(input))
        if self.owner._count_query:
            self.owner.query_embedding_tokens += tokens
        return vectors


def _embed_gemini(texts: list[str]) -> tuple[list[list[float]], int]:
    from app.ai.gemini_client import client

    models = [settings.GEMINI_EMBEDDING_MODEL, _FALLBACK_MODEL]
    last_error: Exception | None = None
    for model in dict.fromkeys(models):
        try:
            response = client.models.embed_content(model=model, contents=texts)
        except Exception as error:
            last_error = error
            message = str(error).casefold()
            if "not found" in message or "not supported" in message or "invalid model" in message:
                logger.info("El modelo de embedding %s no está disponible: %s", model, error)
                continue
            raise
        vectors = [list(item.values) for item in response.embeddings]
        usage = getattr(response, "usage_metadata", None)
        tokens = int(getattr(usage, "prompt_token_count", 0) or 0) if usage is not None else 0
        return vectors, tokens
    assert last_error is not None
    raise last_error


class Indice:
    def __init__(self) -> None:
        self.rag_ready = False
        self._chunks: list[Chunk] = []
        self._collection = None
        self._bm25: BM25Okapi | None = None
        self._count_query = False
        self.query_embedding_tokens = 0
        self.query_embedding_latency_ms = 0.0

    def cargar(self) -> int:
        try:
            chunks = load_chunks()
            self._chunks = chunks
            if not chunks:
                self.rag_ready = False
                self._collection = None
                return 0
            embedder = HashEmbedding() if settings.EMBEDDING_PROVIDER == "hash" else GeminiEmbedding(self)
            client = chromadb.EphemeralClient()
            collection = client.get_or_create_collection(
                name="portfolio",
                embedding_function=embedder,
                metadata={"hnsw:space": "cosine"},
            )
            collection.add(
                ids=[chunk.id for chunk in chunks],
                documents=[chunk.text for chunk in chunks],
                metadatas=[
                    {"project_id": chunk.project_id, "lang": chunk.lang, "source": chunk.source}
                    for chunk in chunks
                ],
            )
            self._collection = collection
            self._bm25 = BM25Okapi([_tokens(chunk.text) or ["vacio"] for chunk in chunks])
            self.rag_ready = True
            logger.info("Índice portfolio con %s pasajes.", len(chunks))
            return len(chunks)
        except Exception:
            logger.exception("No se pudo armar el índice del corpus")
            self.rag_ready = False
            self._collection = None
            self._bm25 = None
            return 0

    def buscar(self, consulta: str, top_k: int | None = None) -> list[dict[str, str]]:
        if not self.rag_ready or self._collection is None or not self._chunks:
            return []
        self.query_embedding_tokens = 0
        self._count_query = True
        started = time.perf_counter()
        vector_ids = self._ranking_vectorial(consulta)
        self.query_embedding_latency_ms = (time.perf_counter() - started) * 1000
        self._count_query = False
        fused = _rrf(vector_ids, self._ranking_lexico(consulta))
        by_id = {chunk.id: chunk for chunk in self._chunks}
        passages: list[dict[str, str]] = []
        for chunk_id, _score in fused[: top_k or settings.RAG_TOP_K]:
            chunk = by_id.get(chunk_id)
            if chunk is None:
                continue
            passages.append(
                {
                    "project_id": chunk.project_id,
                    "lang": chunk.lang,
                    "source": chunk.source,
                    "text": chunk.text,
                }
            )
        return passages

    def _ranking_vectorial(self, consulta: str) -> list[str]:
        count = min(len(self._chunks), max(settings.RAG_TOP_K, 3))
        result = self._collection.query(query_texts=[consulta], n_results=count)
        return [str(item) for item in (result.get("ids") or [[]])[0]]

    def _ranking_lexico(self, consulta: str) -> list[str]:
        if self._bm25 is None:
            return []
        scores = self._bm25.get_scores(_tokens(consulta))
        order = sorted(range(len(scores)), key=lambda index: scores[index], reverse=True)
        return [self._chunks[index].id for index in order if scores[index] > 0]


indice = Indice()
