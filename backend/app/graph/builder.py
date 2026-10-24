"""Grafo: router, dos lectores en paralelo, evidencia y compositor.

    router -> bibliotecario -> evidencia -> compositor
           -> investigador  /
"""

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.graph.nodes import bibliotecario, compositor, evidencia, investigador, router
from app.graph.state import PortfolioState

NODE_NAME = "compositor"

_GRAPH: CompiledStateGraph | None = None


def build_portfolio_graph(checkpointer: BaseCheckpointSaver | None = None) -> CompiledStateGraph:
    graph = StateGraph(PortfolioState)
    graph.add_node("router", router)
    graph.add_node("bibliotecario", bibliotecario)
    graph.add_node("investigador", investigador)
    graph.add_node("evidencia", evidencia, defer=True)
    graph.add_node(NODE_NAME, compositor)
    graph.add_edge(START, "router")
    graph.add_edge("router", "bibliotecario")
    graph.add_edge("router", "investigador")
    graph.add_edge(["bibliotecario", "investigador"], "evidencia")
    graph.add_edge("evidencia", NODE_NAME)
    graph.add_edge(NODE_NAME, END)
    return graph.compile(checkpointer=checkpointer or MemorySaver())


def set_portfolio_graph(graph: CompiledStateGraph) -> None:
    global _GRAPH
    _GRAPH = graph


def get_portfolio_graph() -> CompiledStateGraph:
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = build_portfolio_graph()
    return _GRAPH
