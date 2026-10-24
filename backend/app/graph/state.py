"""Estado del grafo. Los campos vacíos se llenan en las fases siguientes."""

from typing import Any, TypedDict


class PortfolioState(TypedDict, total=False):
    question: str
    plan: str
    facts: dict[str, Any]
    passages: list[Any]
    response: dict[str, Any]
    attempts: int
    messages: list[Any]
    metrics: list[dict[str, Any]]
