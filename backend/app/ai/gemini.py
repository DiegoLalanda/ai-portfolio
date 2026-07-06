"""Cliente mínimo de Google Gemini.

Sin fallback, sin múltiples modelos, sin memoria, sin RAG. Solo un cliente
inicializado y una función para generar texto a partir de un prompt.
"""

import asyncio

from google import genai

from app.core.config import settings

MODEL = "gemini-3.5-flash"

client = genai.Client(api_key=settings.GEMINI_API_KEY)


def generate(prompt: str) -> str:
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
    )
    return response.text


async def generate_async(prompt: str) -> str:
    """Versión async de `generate` para usar desde endpoints FastAPI.

    El SDK de Gemini es síncrono por debajo; se delega a un hilo aparte para
    no bloquear el event loop mientras se espera la respuesta de la API.
    """
    return await asyncio.to_thread(generate, prompt)
