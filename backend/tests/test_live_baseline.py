"""Línea de base real contra Gemini. No corre en `pytest` pelado ni en CI."""

import asyncio
import json
import time
from pathlib import Path
from uuid import uuid4

import pytest

from app.ai.gemini_agent import generate_with_events
from app.core.config import settings
from app.graph.builder import get_portfolio_graph
from app.prompts import SYSTEM_PROMPT
from app.schemas.agent_response import AgentResponse
from app.services.chat_context import build_agent_prompt
from tests.test_golden_set import MEASURED_IDS, load_questions

pytestmark = pytest.mark.live

REPORT_PATH = Path(__file__).resolve().parents[1] / "evidencia" / "medicion.json"


def _totals(metrics: list[dict], row: dict, response_language: str, response_summary: str, tools: list[str], engine: str) -> dict:
    summary = response_summary.casefold()
    for forbidden in row["forbidden_substrings"]:
        assert forbidden.casefold() not in summary, row["id"]
    for tool in row["expected_tools"]:
        assert tool in tools, row["id"]
    assert response_language == row["language"], row["id"]

    prompt_tokens = sum(item["prompt_tokens"] for item in metrics)
    output_tokens = sum(item["output_tokens"] for item in metrics)
    total_tokens = sum(item["total_tokens"] for item in metrics)
    latency_ms = round(sum(item["latency_ms"] for item in metrics), 1)
    assert total_tokens >= 1, row["id"]
    assert latency_ms > 0, row["id"]
    return {
        "id": row["id"],
        "engine": engine,
        "calls": len(metrics),
        "latency_ms": latency_ms,
        "prompt_tokens": prompt_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }


def _legacy_report(row: dict) -> dict:
    metrics: list[dict] = []
    tools: list[str] = []

    def on_event(event: dict) -> None:
        if event.get("type") == "tool_call":
            tools.append(event["tool"])

    response = asyncio.run(
        generate_with_events(
            build_agent_prompt(row["question"]),
            system_instruction=SYSTEM_PROMPT,
            on_event=on_event,
            metrics=metrics,
        )
    )
    return _totals(metrics, row, response.language, response.summary, tools, "legacy")


def _langgraph_report(row: dict) -> dict:
    graph = get_portfolio_graph()
    state = asyncio.run(
        graph.ainvoke(
            {
                "question": build_agent_prompt(row["question"]),
                "attempts": 0,
                "passages": [],
                "messages": [],
            },
            config={"configurable": {"thread_id": f"live-{row['id']}-{uuid4()}"}},
        )
    )
    response = AgentResponse.model_validate(state["response"])
    metrics = state["metrics"]
    tools = [name for item in metrics for name in item["tools"]]
    return _totals(metrics, row, response.language, response.summary, tools, "langgraph")


def _retry(report, row: dict) -> dict:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            return report(row)
        except TimeoutError as error:
            last_error = error
            if attempt < 2:
                time.sleep(5)
        except AssertionError as error:
            last_error = error
            if attempt < 2:
                time.sleep(12)
        except Exception as error:
            if "RESOURCE_EXHAUSTED" not in str(error) and "429" not in str(error):
                raise
            last_error = error
            time.sleep(50)
    assert last_error is not None
    raise last_error


def _saved_rows() -> tuple[dict[str, dict], dict[str, dict]]:
    if not REPORT_PATH.is_file():
        return {}, {}
    saved = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    block = saved.get("fase-2") if isinstance(saved, dict) else None
    if not isinstance(block, dict):
        return {}, {}
    legacy = {item["id"]: item for item in block.get("legacy", [])}
    langgraph = {item["id"]: item for item in block.get("langgraph", [])}
    return legacy, langgraph


@pytest.fixture(scope="module")
def live_report():
    if not settings.GEMINI_API_KEY.strip():
        pytest.skip("GEMINI_API_KEY vacía")

    rows = [row for row in load_questions() if row["id"] in MEASURED_IDS]
    assert {row["id"] for row in rows} == MEASURED_IDS
    saved_legacy, saved_langgraph = _saved_rows()
    legacy: list[dict] = []
    langgraph: list[dict] = []
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    for index, row in enumerate(rows):
        have_legacy = row["id"] in saved_legacy
        have_graph = row["id"] in saved_langgraph
        if index and not (have_legacy and have_graph):
            time.sleep(12)
        measured_legacy = not have_legacy
        legacy.append(saved_legacy[row["id"]] if have_legacy else _retry(_legacy_report, row))
        if not have_graph:
            if measured_legacy or have_legacy:
                time.sleep(12)
            langgraph.append(_retry(_langgraph_report, row))
        else:
            langgraph.append(saved_langgraph[row["id"]])
        payload = _with_phase(legacy, langgraph)
        REPORT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    payload = _with_phase(legacy, langgraph)
    print(json.dumps(payload["fase-2"], ensure_ascii=False, indent=2))
    return legacy, langgraph


def _with_phase(legacy: list[dict], langgraph: list[dict]) -> dict:
    previous = None
    if REPORT_PATH.is_file():
        previous = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    if isinstance(previous, list):
        payload = {"fase-0": previous}
    elif isinstance(previous, dict):
        payload = dict(previous)
    else:
        payload = {}
    payload["fase-2"] = {"legacy": legacy, "langgraph": langgraph}
    return payload


def test_live_baseline_covers_five_questions(live_report):
    legacy, langgraph = live_report
    assert {item["id"] for item in legacy} == MEASURED_IDS
    assert {item["id"] for item in langgraph} == MEASURED_IDS
    assert all(item["engine"] == "legacy" for item in legacy)
    assert all(item["engine"] == "langgraph" for item in langgraph)
    saved = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    assert saved["fase-2"]["legacy"] == legacy
    assert saved["fase-2"]["langgraph"] == langgraph
    assert "fase-0" in saved
    assert "fase-1" in saved
