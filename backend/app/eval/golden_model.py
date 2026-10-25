"""Modelo falso compatible con get_chat_model() para la rúbrica del golden set."""

from __future__ import annotations

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult

from app.graph.decision import RouterDecision
from app.schemas.agent_response import AgentResponse

_ROW: dict = {}
_COMPOSER_CALLS = 0
_BAD_FIRST = False


def bind_golden_row(row: dict) -> None:
    global _ROW, _COMPOSER_CALLS, _BAD_FIRST
    _ROW = dict(row)
    _COMPOSER_CALLS = 0
    _BAD_FIRST = False


def enable_bad_first_composer() -> None:
    global _BAD_FIRST
    _BAD_FIRST = True


class GoldenEvalChatModel(BaseChatModel):
    """Devuelve RouterDecision y AgentResponse según la fila activa del JSONL."""

    @property
    def _llm_type(self) -> str:
        return "golden-eval"

    def with_structured_output(self, schema, **_kwargs):
        self._schema = schema
        return self

    async def ainvoke(self, _messages):
        usage = {"input_tokens": 4, "output_tokens": 2, "total_tokens": 6}
        raw = AIMessage(content="{}", usage_metadata=usage)
        schema = getattr(self, "_schema", AgentResponse)
        if schema is RouterDecision:
            family = _ROW.get("family", "")
            if family == "narrative-later":
                parsed = RouterDecision(
                    route="narrative",
                    tools=list(_ROW.get("expected_tools") or []),
                    language=_ROW["language"],
                    retrieval_query=_ROW["question"],
                )
            else:
                parsed = RouterDecision(
                    route="facts" if _ROW.get("expected_tools") else "direct",
                    tools=list(_ROW.get("expected_tools") or []),
                    language=_ROW["language"],
                    retrieval_query="",
                )
            return {"raw": raw, "parsed": parsed}
        global _COMPOSER_CALLS
        _COMPOSER_CALLS += 1
        if _BAD_FIRST and _COMPOSER_CALLS == 1:
            widget_id = "proj-finni"
        else:
            widget_id = (_ROW.get("allowed_ids") or [_ROW["id"]])[0]
        parsed = AgentResponse(
            language=_ROW["language"],
            title=_ROW["id"],
            summary="Respuesta de rúbrica.",
            widgets=[{"id": widget_id, "type": "text", "data": {}}],
            suggested_actions=[],
        )
        return {"raw": raw, "parsed": parsed}

    def _generate(self, messages: list[BaseMessage], stop=None, run_manager=None, **kwargs) -> ChatResult:
        raise NotImplementedError("La rúbrica usa ainvoke async.")

    @property
    def composer_calls(self) -> int:
        return _COMPOSER_CALLS


def golden_eval_model() -> GoldenEvalChatModel:
    return GoldenEvalChatModel()
