from app.graph.response_locale import detect_visitor_language, harmonize_response_language
from app.graph.widget_evidence import ensure_passage_widgets
from app.schemas.agent_response import AgentResponse, Widget


def test_detect_spanish_question():
    assert detect_visitor_language("¿Quién es Diego?") == "es"


def test_detect_english_question():
    assert detect_visitor_language("How can I contact you?") == "en"


def test_harmonize_fixes_language_and_chips():
    response = AgentResponse(
        language="en",
        title="T",
        summary="S",
        widgets=[Widget(id="w1", type="projects", title=None, data={})],
        suggested_actions=[],
    )
    out = harmonize_response_language(
        response,
        visitor_question="¿Qué proyectos hiciste?",
        question_prompt="## VISITOR QUESTION\n\n¿Qué proyectos hiciste?",
        router_language="es",
    )
    assert out.language == "es"
    assert len(out.suggested_actions) == 2
    assert out.suggested_actions[0].label.startswith("Ver ")


def test_ensure_passage_widgets_replaces_plain_text():
    response = AgentResponse(
        language="es",
        title="T",
        summary="S",
        widgets=[Widget(id="x", type="text", title=None, data={"text": "..."})],
        suggested_actions=[],
    )
    out = ensure_passage_widgets(response, [{"text": "rag chunk"}])
    types = [widget.type for widget in out.widgets]
    assert "technology-cloud" in types
    assert "text" not in types
