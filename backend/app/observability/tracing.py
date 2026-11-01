"""Trazas por nodo del grafo. JSONL local por defecto; OTLP opcional si hay endpoint."""

from __future__ import annotations

import inspect
import json
import logging
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from functools import wraps
from pathlib import Path
from typing import Any, ParamSpec, TypeVar

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SimpleSpanProcessor, SpanExporter, SpanExportResult

from app.core.config import settings

logger = logging.getLogger(__name__)

P = ParamSpec("P")
R = TypeVar("R")

_TRACE_DIR = Path(__file__).resolve().parents[2] / "evidencia"
_memory_spans: list[Any] = []
_configured = False


class _MemoryExporter(SpanExporter):
    def export(self, spans) -> SpanExportResult:
        _memory_spans.extend(spans)
        return SpanExportResult.SUCCESS

    def shutdown(self) -> None:
        return None

    def force_flush(self, timeout_millis: int = 30000) -> bool:
        return True


class _JsonlExporter(SpanExporter):
    def export(self, spans) -> SpanExportResult:
        _TRACE_DIR.mkdir(parents=True, exist_ok=True)
        path = _TRACE_DIR / "trazas.jsonl"
        with path.open("a", encoding="utf-8") as handle:
            for span in spans:
                handle.write(
                    json.dumps(
                        {
                            "nombre": span.name,
                            "atributos": {
                                key: _serialize(value) for key, value in (span.attributes or {}).items()
                            },
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
        return SpanExportResult.SUCCESS

    def shutdown(self) -> None:
        return None

    def force_flush(self, timeout_millis: int = 30000) -> bool:
        return True


def _collector_endpoint(raw: str) -> str:
    url = raw.strip().rstrip("/")
    if not url:
        return ""
    if url.endswith("/v1/traces"):
        return url
    return f"{url}/v1/traces"


def _otlp_headers() -> dict[str, str] | None:
    key = settings.PHOENIX_API_KEY.strip()
    if not key:
        return None
    return {"Authorization": f"Bearer {key}"}


def configure_tracing() -> None:
    global _configured
    if _configured:
        return
    provider = TracerProvider(
        resource=Resource.create(
            {
                "service.name": settings.PHOENIX_PROJECT_NAME,
                "openinference.project.name": settings.PHOENIX_PROJECT_NAME,
            }
        )
    )
    provider.add_span_processor(SimpleSpanProcessor(_MemoryExporter()))
    endpoint = _collector_endpoint(settings.PHOENIX_COLLECTOR_ENDPOINT)
    if not endpoint or settings.TRACE_JSONL:
        provider.add_span_processor(SimpleSpanProcessor(_JsonlExporter()))
    if endpoint:
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

        headers = _otlp_headers()
        exporter = OTLPSpanExporter(endpoint=endpoint, headers=headers)
        provider.add_span_processor(BatchSpanProcessor(exporter))
        logger.info("Trazas OTLP hacia %s", endpoint)
    elif not settings.TRACE_JSONL:
        logger.info("Trazas locales en %s/trazas.jsonl", _TRACE_DIR)
    _instrument_langchain(provider)
    trace.set_tracer_provider(provider)
    _configured = True


def clear_traces() -> None:
    _memory_spans.clear()
    path = _TRACE_DIR / "trazas.jsonl"
    if path.is_file():
        path.write_text("", encoding="utf-8")


def exported_spans() -> list[Any]:
    return list(_memory_spans)


@contextmanager
def node_span(name: str, **attributes: object) -> Iterator[None]:
    tracer = trace.get_tracer("ai-portfolio")
    with tracer.start_as_current_span(name) as span:
        span.set_attribute("prompt.version", settings.PROMPT_VERSION)
        span.set_attribute("langgraph.node", name)
        for key, value in attributes.items():
            if isinstance(value, (str, bool, int, float)):
                span.set_attribute(key, value)
        yield


def trace_node(name: str) -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorator(fn: Callable[P, R]) -> Callable[P, R]:
        if inspect.iscoroutinefunction(fn):

            @wraps(fn)
            async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
                with node_span(name):
                    return await fn(*args, **kwargs)

            return async_wrapper  # type: ignore[return-value]

        @wraps(fn)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            with node_span(name):
                return fn(*args, **kwargs)

        return sync_wrapper

    return decorator


def _instrument_langchain(provider: TracerProvider) -> None:
    try:
        from openinference.instrumentation.langchain import LangChainInstrumentor
    except ImportError:
        logger.info("OpenInference no instalado; quedan spans por nodo.")
        return
    LangChainInstrumentor().instrument(tracer_provider=provider)


def _serialize(value: object) -> object:
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)
