import pytest
from pydantic import ValidationError
from app.schemas.chat import ChatRequest
from app.schemas.agent_response import AgentResponse, Widget, SuggestedAction


def test_chat_request_valid():
    request = ChatRequest(
        question="¿Cuáles son los proyectos de Diego?",
        shown_widget_types=["skills", "projects"],
        prior_questions=["¿Quién es Diego?"]
    )
    assert request.question == "¿Cuáles son los proyectos de Diego?"
    assert request.shown_widget_types == ["skills", "projects"]
    assert request.prior_questions == ["¿Quién es Diego?"]
    assert request.thread_id is None


def test_chat_request_accepts_thread_id():
    request = ChatRequest(question="Hola", thread_id="abc-123")
    assert request.thread_id == "abc-123"


def test_chat_request_empty_question():
    with pytest.raises(ValidationError):
        ChatRequest(question="")


def test_chat_request_too_long_question():
    long_question = "a" * 501
    with pytest.raises(ValidationError):
        ChatRequest(question=long_question)


def test_agent_response_valid():
    response = AgentResponse(
        language="es",
        title="Experiencia de Diego",
        summary="Diego es un ingeniero de software...",
        widgets=[
            Widget(
                id="skills-widget",
                type="skills",
                title="Habilidades",
                data={"items": []}
            )
        ],
        suggested_actions=[
            SuggestedAction(
                label="Ver proyectos",
                action="ask",
                payload="¿Qué proyectos ha construido?"
            )
        ]
    )
    assert response.language == "es"
    assert len(response.widgets) == 1
    assert response.widgets[0].type == "skills"
    assert len(response.suggested_actions) == 1


def test_agent_response_invalid_language():
    with pytest.raises(ValidationError):
        AgentResponse(
            language="fr",  # Solo se soporta "es" o "en"
            title="Titre",
            summary="Résumé"
        )


def test_widget_invalid_type():
    with pytest.raises(ValidationError):
        Widget(
            id="invalid-widget",
            type="invalid_type_here",  # Tipo no soportado en la Literal
            title="Habilidades",
            data={}
        )
