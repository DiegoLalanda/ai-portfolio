from app.graph.widget_evidence import align_response_with_evidence, build_fact_widgets, widgets_for_selection
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


def test_selection_keeps_only_requested_types():
    tools = {
        "get_projects": [{"id": "p1"}],
        "get_skills": {"categories": {"ai": ["Python"], "frontend": ["React"]}},
        "get_experience": [{"id": "exp"}],
    }
    widgets = widgets_for_selection(
        tools,
        passages=[{"text": "note"}],
        widget_types=["experience"],
    )
    assert [widget.type for widget in widgets] == ["experience"]


def test_selection_scopes_projects_and_skills():
    tools = {
        "get_projects": [{"id": "p1"}],
        "get_skills": {"categories": {"ai": ["Python"], "frontend": ["React"]}},
    }
    widgets = widgets_for_selection(
        tools,
        passages=[],
        widget_types=["projects", "skills"],
        project_groups=["ia"],
        skill_categories=["frontend"],
    )
    by_type = {widget.type: widget for widget in widgets}
    assert by_type["projects"].data["displayGroups"] == ["ia"]
    assert by_type["skills"].data["categories"] == {"frontend": ["React"]}


def test_selection_keeps_named_skills_only():
    tools = {
        "get_skills": {
            "categories": {
                "ai": ["Python", "RAG"],
                "backend-data": ["PostgreSQL", "Express.js"],
                "cloud-devops": ["DynamoDB", "Docker"],
            }
        }
    }
    widgets = widgets_for_selection(
        tools,
        passages=[],
        widget_types=["skills"],
        skill_names=["PostgreSQL", "DynamoDB"],
    )
    assert widgets[0].data["categories"] == {
        "backend-data": ["PostgreSQL"],
        "cloud-devops": ["DynamoDB"],
    }


def test_database_question_focuses_data_tools_only():
    from app.graph.skill_focus import focus_skill_names
    from app.tools.get_skills import get_skills

    names = focus_skill_names(
        "¿Con qué bases de datos y herramientas de datos trabajaste?",
        get_skills(),
    )
    assert names is not None
    assert "PostgreSQL" in names
    assert "MySQL" in names
    assert "DynamoDB" in names
    assert "TypeORM" in names
    assert "Redis" in names
    assert "Python" not in names
    assert "FastAPI" not in names
    assert "React" not in names


def test_broad_stack_question_is_not_focused():
    from app.graph.skill_focus import focus_skill_names
    from app.tools.get_skills import get_skills

    assert focus_skill_names("¿Cuál es tu stack completo?", get_skills()) is None


def test_evidence_brief_lists_every_skill_name():
    from app.graph.nodes import _evidence_brief
    from app.tools.get_skills import get_skills

    brief = _evidence_brief({"get_skills": get_skills()})
    names = [name for group in brief["get_skills"]["by_category"].values() for name in group]
    assert "PostgreSQL" in names
    assert "DynamoDB" in names
    assert "Python" in names


def test_selection_drops_types_without_evidence():
    widgets = widgets_for_selection(
        {},
        passages=[],
        widget_types=["projects", "technology-cloud"],
        cv_download=True,
    )
    assert [widget.id for widget in widgets] == ["cv-download"]
