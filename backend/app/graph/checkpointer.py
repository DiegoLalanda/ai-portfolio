"""Checkpointer del grafo. SQLite en disco con caída a memoria."""

from __future__ import annotations

import logging
from contextlib import AsyncExitStack
from typing import TYPE_CHECKING

from langgraph.checkpoint.memory import MemorySaver

if TYPE_CHECKING:
    from langgraph.checkpoint.base import BaseCheckpointSaver

logger = logging.getLogger(__name__)

_stack: AsyncExitStack | None = None
_saver: BaseCheckpointSaver | None = None


async def start_checkpointer(conn_string: str) -> BaseCheckpointSaver:
    global _stack, _saver
    _stack = AsyncExitStack()
    try:
        from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

        saver = await _stack.enter_async_context(AsyncSqliteSaver.from_conn_string(conn_string))
        _saver = saver
        logger.info("Checkpointer SQLite activo en %s", conn_string)
        return saver
    except Exception:
        logger.exception("No se pudo abrir el checkpointer SQLite; uso memoria")
        await _stack.aclose()
        _stack = None
        _saver = MemorySaver()
        return _saver


async def stop_checkpointer() -> None:
    global _stack, _saver
    if _stack is not None:
        await _stack.aclose()
    _stack = None
    _saver = None


def get_checkpointer() -> BaseCheckpointSaver:
    return _saver if _saver is not None else MemorySaver()
