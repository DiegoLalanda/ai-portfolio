"""Cliente base de Google Gemini (modelo, tools, client)."""

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

MODEL = "gemini-3.1-flash-lite"

client = genai.Client(api_key=settings.GEMINI_API_KEY)

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

# Re-export for typing / tests
GenerateContentConfig = types.GenerateContentConfig
