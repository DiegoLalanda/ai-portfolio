"""Estado del grafo. `metrics` acumula las llamadas de cada nodo."""

from typing import Annotated, Any, TypedDict


def _append(left: list[dict[str, Any]] | None, right: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    return list(left or []) + list(right or [])


class PortfolioState(TypedDict, total=False):
    question: str
    plan: dict[str, Any]
    facts: dict[str, Any]
    passages: list[Any]
    response: dict[str, Any]
    attempts: int
    messages: list[Any]
    metrics: Annotated[list[dict[str, Any]], _append]
