import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.graph.builder import build_portfolio_graph, set_portfolio_graph
from app.graph.checkpointer import get_checkpointer, start_checkpointer, stop_checkpointer
from app.observability.tracing import configure_tracing
from app.rag.hybrid import indice

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    configure_tracing()
    checkpoint_path = Path(settings.CHECKPOINT_PATH)
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    await start_checkpointer(str(checkpoint_path))
    set_portfolio_graph(build_portfolio_graph(get_checkpointer()))
    indice.cargar()
    try:
        yield
    finally:
        await stop_checkpointer()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

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
