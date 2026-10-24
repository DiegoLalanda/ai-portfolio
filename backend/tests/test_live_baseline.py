"""Línea de base real contra Gemini. No corre en `pytest` pelado ni en CI."""

import asyncio
import json
from pathlib import Path

import pytest

from app.ai.gemini_agent import generate_with_events
from app.core.config import settings
from app.prompts import SYSTEM_PROMPT
from app.services.chat_context import build_agent_prompt
from tests.test_golden_set import MEASURED_IDS, load_questions

pytestmark = pytest.mark.live

REPORT_PATH = Path(__file__).resolve().parents[1] / "evidencia" / "medicion.json"


def _row_report(row: dict) -> dict:
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
    summary = response.summary.casefold()
    for forbidden in row["forbidden_substrings"]:
        assert forbidden.casefold() not in summary, row["id"]
    for tool in row["expected_tools"]:
        assert tool in tools, row["id"]
    assert response.language == row["language"], row["id"]

    prompt_tokens = sum(item["prompt_tokens"] for item in metrics)
    output_tokens = sum(item["output_tokens"] for item in metrics)
    total_tokens = sum(item["total_tokens"] for item in metrics)
    latency_ms = round(sum(item["latency_ms"] for item in metrics), 1)
    assert total_tokens >= 1, row["id"]
    assert latency_ms > 0, row["id"]
    return {
        "id": row["id"],
        "engine": "legacy",
        "calls": len(metrics),
        "latency_ms": latency_ms,
        "prompt_tokens": prompt_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }


@pytest.fixture(scope="module")
def live_report():
    if not settings.GEMINI_API_KEY.strip():
        pytest.skip("GEMINI_API_KEY vacía")

    rows = [row for row in load_questions() if row["id"] in MEASURED_IDS]
    assert {row["id"] for row in rows} == MEASURED_IDS
    report = [_row_report(row) for row in rows]
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = _with_phase(report)
    REPORT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload["fase-1"], ensure_ascii=False, indent=2))
    return report


def _with_phase(report: list[dict]) -> dict:
    previous = None
    if REPORT_PATH.is_file():
        previous = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    if isinstance(previous, list):
        return {"fase-0": previous, "fase-1": report}
    if isinstance(previous, dict):
        return {**previous, "fase-1": report}
    return {"fase-1": report}


def test_live_baseline_covers_five_questions(live_report):
    assert {item["id"] for item in live_report} == MEASURED_IDS
    assert all(item["engine"] == "legacy" for item in live_report)
    saved = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    assert saved["fase-1"] == live_report
    assert "fase-0" in saved
