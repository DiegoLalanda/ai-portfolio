from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Portfolio API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    HOST: str = "127.0.0.1"
    PORT: int = 8000
    RELOAD: bool = True

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:4321"]
    GEMINI_API_KEY: str = ""
    GRAPH_ENGINE: Literal["legacy", "langgraph"] = "langgraph"
    LLM_TIMEOUT_ROUTER_S: float = 12
    LLM_TIMEOUT_COMPOSER_S: float = 25
    EMBEDDING_PROVIDER: Literal["gemini", "hash"] = "gemini"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    RAG_TOP_K: int = 4
    CHECKPOINT_PATH: str = "data/checkpoints.sqlite"
    PROMPT_VERSION: str = "2026-03-29"
    PHOENIX_COLLECTOR_ENDPOINT: str = ""
    PHOENIX_API_KEY: str = ""
    PHOENIX_PROJECT_NAME: str = "ai-portfolio"
    TRACE_JSONL: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
