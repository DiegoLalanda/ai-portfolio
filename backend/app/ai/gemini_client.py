"""Cliente base de Google Gemini (modelo, tools, clients por API key)."""

from __future__ import annotations

from functools import lru_cache

from google import genai
from google.genai import types

from app.core.config import settings
from app.tools import (
    get_certifications,
    get_contact,
    get_education,
    get_experience,
    get_languages,
    get_projects,
    get_skills,
    get_soft_skills,
    get_timeline,
)

TOOLS = [
    get_projects,
    get_experience,
    get_skills,
    get_soft_skills,
    get_timeline,
    get_education,
    get_certifications,
    get_languages,
    get_contact,
]

GenerateContentConfig = types.GenerateContentConfig


def chat_model_id() -> str:
    return settings.GEMINI_CHAT_MODEL.strip() or "gemini-3.5-flash-lite"


# Compat tests / imports legacy
MODEL = chat_model_id()


def gemini_api_keys() -> list[str]:
    """Claves en orden de uso. La fallback solo ayuda si es distinta (otro proyecto/cuota)."""

    keys: list[str] = []
    primary = settings.GEMINI_API_KEY.strip()
    if primary:
        keys.append(primary)
    fallback = settings.GEMINI_API_KEY_FALLBACK.strip()
    if fallback and fallback not in keys:
        keys.append(fallback)
    return keys


@lru_cache(maxsize=4)
def get_genai_client(api_key: str) -> genai.Client:
    return genai.Client(api_key=api_key)


def primary_genai_client() -> genai.Client:
    keys = gemini_api_keys()
    if not keys:
        return genai.Client(api_key="")
    return get_genai_client(keys[0])


# Compat: RAG embeddings y código que importaba `client`
client = primary_genai_client()
