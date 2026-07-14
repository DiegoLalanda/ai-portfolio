import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.schemas.agent_response import AgentResponse


client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@patch("app.api.v1.endpoints.chat.get_answer", new_callable=AsyncMock)
def test_chat_endpoint_success(mock_get_answer):
    # Mockear la respuesta del servicio de chat
    mock_response = AgentResponse(
        language="es",
        title="Respuesta de prueba",
        summary="Este es un resumen de prueba.",
        widgets=[],
        suggested_actions=[]
    )
    mock_get_answer.return_value = mock_response

    payload = {
        "question": "¿Cuáles son las habilidades de Diego?",
        "shown_widget_types": [],
        "prior_questions": []
    }

    # Desactivar temporalmente el rate limiter para esta prueba si es necesario,
    # o simplemente limpiar el historial antes
    from app.core.rate_limiter import _request_history
    _request_history.clear()

    response = client.post("/api/v1/chat", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Respuesta de prueba"
    assert data["summary"] == "Este es un resumen de prueba."
    mock_get_answer.assert_called_once_with(
        "¿Cuáles son las habilidades de Diego?",
        shown_widget_types=[],
        prior_questions=[]
    )


def test_chat_endpoint_validation_error():
    # Pregunta vacía debería fallar la validación
    payload = {
        "question": "",
        "shown_widget_types": [],
        "prior_questions": []
    }
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 422


def test_chat_endpoint_too_long_validation_error():
    # Pregunta demasiado larga (>500 caracteres) debería fallar la validación
    payload = {
        "question": "a" * 501,
        "shown_widget_types": [],
        "prior_questions": []
    }
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 422
