from app.graph.suggested_actions import ensure_suggested_actions, has_dashboard_context, parse_visible_widget_types
from app.schemas.agent_response import AgentResponse, Widget


def test_has_dashboard_context():
    assert has_dashboard_context("## DASHBOARD CONTEXT (follow-up)\n\n## VISITOR QUESTION")
    assert not has_dashboard_context("## VISITOR QUESTION\n\nHola")


def test_parse_visible_widget_types():
    prompt = (
        "## DASHBOARD CONTEXT (follow-up in the same session)\n"
        "These widget types are ALREADY visible on the dashboard: projects, skills.\n"
    )
    assert parse_visible_widget_types(prompt) == {"projects", "skills"}


def test_ensure_adds_two_actions_on_first_turn():
    response = AgentResponse(
        language="es",
        title="T",
        summary="S",
        widgets=[Widget(id="w1", type="projects", title=None, data={})],
        suggested_actions=[],
    )
    out = ensure_suggested_actions(response, question_prompt="## VISITOR QUESTION\n\nProyectos?")
    assert len(out.suggested_actions) == 2
    assert all(action.action == "ask" for action in out.suggested_actions)
    assert not any("proyecto" in action.payload.lower() for action in out.suggested_actions)


def test_ensure_skips_when_composer_filled():
    response = AgentResponse(
        language="es",
        title="T",
        summary="S",
        widgets=[Widget(id="w1", type="projects", title=None, data={})],
        suggested_actions=[{"label": "X", "action": "ask", "payload": "Y?"}],
    )
    out = ensure_suggested_actions(response, question_prompt="## VISITOR QUESTION\n\nHola")
    assert len(out.suggested_actions) == 1


def test_ensure_respects_dashboard_context():
    response = AgentResponse(
        language="en",
        title="T",
        summary="S",
        widgets=[Widget(id="w1", type="experience", title=None, data={"items": []})],
        suggested_actions=[],
    )
    prompt = (
        "## DASHBOARD CONTEXT (follow-up in the same session)\n"
        "These widget types are ALREADY visible on the dashboard: projects, skills.\n\n"
        "## VISITOR QUESTION\n\nTell me more"
    )
    out = ensure_suggested_actions(response, question_prompt=prompt)
    labels = " ".join(action.label for action in out.suggested_actions).lower()
    assert "project" not in labels
    assert "skill" not in labels
    assert len(out.suggested_actions) >= 1
