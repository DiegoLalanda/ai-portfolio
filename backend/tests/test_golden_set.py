"""Contrato del golden set y del flag GRAPH_ENGINE. No llama a Gemini."""

import json
from pathlib import Path

from app.core.config import Settings
from app.tools import __all__ as TOOL_NAMES

GOLDEN_PATH = Path(__file__).parent / "golden" / "preguntas.jsonl"
PROJECTS_PATH = Path(__file__).resolve().parents[1] / "app" / "data" / "projects.json"
FAMILIES = {"facts", "grounding", "narrative-later"}
MEASURED_IDS = {
    "es-skills",
    "es-proyectos-ia",
    "en-experiencia",
    "grounding-microsoft",
    "narrative-finni-cola",
}


def load_questions() -> list[dict]:
    lines = GOLDEN_PATH.read_text(encoding="utf-8").splitlines()
    return [json.loads(line) for line in lines if line.strip()]


def test_golden_set_shape():
    questions = load_questions()
    assert len(questions) >= 20

    ids = [item["id"] for item in questions]
    assert len(ids) == len(set(ids))
    assert {item["family"] for item in questions} >= FAMILIES

    measured = [item for item in questions if item["measure"]]
    assert {item["id"] for item in measured} == MEASURED_IDS

    known_tools = set(TOOL_NAMES)
    for item in questions:
        assert 1 <= len(item["question"]) <= 500
        assert item["language"] in {"es", "en"}
        assert set(item["expected_tools"]) <= known_tools
        assert isinstance(item["forbidden_substrings"], list)

    projects = {item["id"] for item in json.loads(PROJECTS_PATH.read_text(encoding="utf-8"))}
    ai_row = next(item for item in questions if item["id"] == "es-proyectos-ia")
    assert ai_row["expected_tools"] == ["get_projects"]
    assert set(ai_row["allowed_ids"]) <= projects
    assert "proj-finni" in ai_row["allowed_ids"]


def test_graph_engine_defaults_to_legacy():
    assert Settings.model_fields["GRAPH_ENGINE"].default == "legacy"
