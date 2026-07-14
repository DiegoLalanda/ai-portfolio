import time
from collections import defaultdict
from fastapi import Request, HTTPException, status

# Diccionario en memoria para almacenar los timestamps de las peticiones por IP
# Estructura: { ip_address: [timestamp1, timestamp2, ...] }
_request_history: dict[str, list[float]] = defaultdict(list)

# Configuración del limitador
RATE_LIMIT_WINDOW_SECONDS = 60.0
RATE_LIMIT_MAX_REQUESTS = 10  # Máximo 10 preguntas por minuto por IP

def rate_limiter(request: Request):
    """Dependency para FastAPI que limita la tasa de peticiones por dirección IP."""
    client_host = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Obtener el historial de la IP y limpiar timestamps antiguos
    history = _request_history[client_host]
    history = [t for t in history if now - t < RATE_LIMIT_WINDOW_SECONDS]
    _request_history[client_host] = history
    
    # Verificar si supera el límite
    if len(history) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiadas preguntas. Por favor, espera un minuto antes de intentar de nuevo."
        )
        
    # Registrar la petición actual
    history.append(now)
