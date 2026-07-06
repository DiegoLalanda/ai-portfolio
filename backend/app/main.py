import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

# Uvicorn no configura el logger raíz de la app por defecto: sin esto,
# `logging.getLogger(__name__).info(...)` en cualquier módulo quedaría en
# silencio aunque el access log de uvicorn siga mostrando cada request.
logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s: %(message)s")

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
def health_check():
    return {"status": "ok"}
