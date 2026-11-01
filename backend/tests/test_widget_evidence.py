from app.graph.widget_evidence import align_response_with_evidence, build_fact_widgets
from app.schemas.agent_response import AgentResponse, Widget


def test_align_drops_projects_without_tool():
    response = AgentResponse(
        language="es",
        title="T",
        summary="S",
        widgets=[
            Widget(id="w1", type="experience", title=None, data={"items": []}),
            Widget(id="w2", type="projects", title=None, data={}),
        ],
        suggested_actions=[],
    )
    tools = {"get_experience": [{"id": "x"}]}
    aligned = align_response_with_evidence(response, tools, passages=[])
    types = [widget.type for widget in aligned.widgets]
    assert types == ["experience"]


def test_align_adds_skills_when_dashboard_present():
    response = AgentResponse(
        language="es",
        title="T",
        summary="S",
        widgets=[Widget(id="w1", type="experience", title=None, data={"items": []})],
        suggested_actions=[],
    )
    tools = {
        "get_experience": [{"id": "x"}],
        "get_skills": {"categories": {"ai": ["Python"]}},
    }
    aligned = align_response_with_evidence(response, tools, passages=[])
    types = {widget.type for widget in aligned.widgets}
    assert types == {"experience", "skills"}


def test_align_adds_widgets_when_composer_returns_empty():
    response = AgentResponse(
        language="es",
        title="T",
        summary="Solo texto.",
        widgets=[],
        suggested_actions=[],
    )
    tools = {
        "get_experience": [{"id": "exp-finnegans-ai-developer", "role": "AI Developer"}],
    }
    aligned = align_response_with_evidence(response, tools, passages=[])
    assert [widget.type for widget in aligned.widgets] == ["experience"]


def test_build_fact_widgets_includes_technology_cloud_with_passages():
    widgets = build_fact_widgets({"get_projects": []}, passages=[{"text": "note"}])
    assert any(widget.type == "technology-cloud" for widget in widgets)
