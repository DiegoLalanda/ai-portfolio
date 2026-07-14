import pytest
from fastapi import Request, HTTPException
from unittest.mock import MagicMock
from app.core.rate_limiter import rate_limiter, _request_history, RATE_LIMIT_MAX_REQUESTS


def test_rate_limiter_under_limit():
    # Limpiar historial de peticiones para la prueba
    _request_history.clear()
    
    # Mockear Request de FastAPI
    mock_request = MagicMock(spec=Request)
    mock_request.client = MagicMock()
    mock_request.client.host = "127.0.0.1"
    
    # Hacer peticiones por debajo del límite
    for _ in range(RATE_LIMIT_MAX_REQUESTS):
        rate_limiter(mock_request)
        
    # No debería lanzar ninguna excepción
    assert len(_request_history["127.0.0.1"]) == RATE_LIMIT_MAX_REQUESTS


def test_rate_limiter_exceeded():
    # Limpiar historial de peticiones para la prueba
    _request_history.clear()
    
    # Mockear Request de FastAPI
    mock_request = MagicMock(spec=Request)
    mock_request.client = MagicMock()
    mock_request.client.host = "127.0.0.1"
    
    # Llenar el límite
    for _ in range(RATE_LIMIT_MAX_REQUESTS):
        rate_limiter(mock_request)
        
    # La siguiente petición debería lanzar HTTPException con status 429
    with pytest.raises(HTTPException) as exc_info:
        rate_limiter(mock_request)
        
    assert exc_info.value.status_code == 429
    assert "Demasiadas preguntas" in exc_info.value.detail


def test_rate_limiter_multiple_ips():
    # Limpiar historial de peticiones para la prueba
    _request_history.clear()
    
    # Mockear dos IPs diferentes
    mock_request_1 = MagicMock(spec=Request)
    mock_request_1.client = MagicMock()
    mock_request_1.client.host = "1.1.1.1"
    
    mock_request_2 = MagicMock(spec=Request)
    mock_request_2.client = MagicMock()
    mock_request_2.client.host = "2.2.2.2"
    
    # IP 1 llena su límite
    for _ in range(RATE_LIMIT_MAX_REQUESTS):
        rate_limiter(mock_request_1)
        
    # IP 1 debería estar bloqueada
    with pytest.raises(HTTPException):
        rate_limiter(mock_request_1)
        
    # IP 2 debería poder hacer peticiones sin problemas
    rate_limiter(mock_request_2)
    assert len(_request_history["2.2.2.2"]) == 1
