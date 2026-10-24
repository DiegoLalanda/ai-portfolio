"""Un nodo que ejecuta el loop actual. El checkpointer queda listo para la fase 5."""

from typing import Any

from langchain_core.callbacks import adispatch_custom_event
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.ai.gemini_agent import generate_with_events
from app.graph.state import PortfolioState
from app.prompts import SYSTEM_PROMPT

NODE_NAME = "agent"


async def run_current_agent(state: PortfolioState, config: RunnableConfig) -> dict[str, Any]:
    """Misma generación que el motor legacy. Los eventos salen por el stream del grafo."""

    metrics: list[dict[str, Any]] = []

    async def on_event(event: dict[str, Any]) -> None:
        await adispatch_custom_event("portfolio", event, config=config)

    response = await generate_with_events(
        state["question"],
        system_instruction=SYSTEM_PROMPT,
        on_event=on_event,
        metrics=metrics,
    )
    return {
        "plan": state.get("plan", ""),
        "facts": state.get("facts", {}),
        "passages": state.get("passages", []),
        "messages": state.get("messages", []),
        "response": response.model_dump(),
        "attempts": int(state.get("attempts") or 0) + 1,
        "metrics": metrics,
    }


def build_portfolio_graph() -> CompiledStateGraph:
    graph = StateGraph(PortfolioState)
    graph.add_node(NODE_NAME, run_current_agent)
    graph.add_edge(START, NODE_NAME)
    graph.add_edge(NODE_NAME, END)
    return graph.compile(checkpointer=MemorySaver())


_GRAPH: CompiledStateGraph | None = None


def get_portfolio_graph() -> CompiledStateGraph:
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = build_portfolio_graph()
    return _GRAPH
