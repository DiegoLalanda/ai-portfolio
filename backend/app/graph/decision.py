"""Decisión corta del router. No incluye resultados de tools."""

from typing import Literal

from pydantic import BaseModel, Field


class RouterDecision(BaseModel):
    route: Literal["facts", "narrative", "both", "direct"] = Field(
        description=(
            "facts: the JSON tools can answer. narrative: the JSON does not contain the story. "
            "both: needs records and a story. direct: greeting or out of scope, no tools."
        )
    )
    tools: list[str] = Field(
        default_factory=list,
        description="Tool names to read. Empty when route is direct.",
    )
    language: Literal["es", "en"]
    retrieval_query: str = ""
