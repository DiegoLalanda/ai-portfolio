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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
