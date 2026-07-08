"""Cliente de Google Gemini con function calling y salida estructurada.

Sin fallback, sin múltiples modelos, sin memoria conversacional, sin RAG.
Un cliente inicializado, la lista de tools del portfolio y una función para
generar una respuesta a partir de un prompt.

Function calling: las tools se pasan como funciones de Python "normales"
(ver `app/tools/`) dentro de `config.tools`. El SDK de google-genai arma el
schema de cada una a partir de su firma y su docstring, y hace Automatic
Function Calling (AFC): el propio modelo decide qué tool(s) llamar según la
pregunta, el SDK las ejecuta en Python y le devuelve el resultado al modelo
antes de generar la respuesta final. No hay ningún if/else manual eligiendo
tools acá: la decisión es 100% del modelo.

Salida estructurada: `response_mime_type="application/json"` +
`response_json_schema=AgentResponse.model_json_schema()` obligan a Gemini a
devolver un JSON que cumple ese contrato (ver `app/schemas/agent_response.py`),
en vez de texto libre. Se usa `response_json_schema` (JSON Schema estándar) en
vez de `response_schema` (subset tipo OpenAPI) porque este último no soporta
`additionalProperties`, necesario para el `data: dict[str, Any]` genérico de
cada widget. Ambas cosas (tools + salida estructurada) funcionan combinadas
en una misma llamada: primero el modelo puede llamar tools para juntar
datos, y recién al final arma la respuesta con el formato exigido.
"""

import asyncio

from google import genai
from google.genai import types

from app.core.config import settings
from app.schemas.agent_response import AgentResponse
from app.tools import (
    get_certifications,
    get_contact,
    get_education,
    get_experience,
    get_languages,
    get_projects,
    get_skills,
    get_timeline,
)

MODEL = "gemini-3.1-flash-lite"

client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Tools disponibles para el modelo. Cada una es una función independiente de
# app/tools/ que lee un único archivo de app/data/ (ver app/tools/__init__.py
# y app/data/README.md). Agregar una tool nueva es solo sumarla acá.
TOOLS = [
    get_projects,
    get_experience,
    get_skills,
    get_timeline,
    get_education,
    get_certifications,
    get_languages,
    get_contact,
]


def generate(prompt: str, system_instruction: str | None = None) -> AgentResponse:
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        tools=TOOLS,
        response_mime_type="application/json",
        response_json_schema=AgentResponse.model_json_schema(),
    )
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=config,
    )
    # Se parsea a mano (en vez de usar `response.parsed`) para que un JSON
    # que no cumpla el schema levante `pydantic.ValidationError` en vez de
    # quedar como `None` en silencio.
    return AgentResponse.model_validate_json(response.text)


async def generate_async(prompt: str, system_instruction: str | None = None) -> AgentResponse:
    """Versión async de `generate` para usar desde endpoints FastAPI.

    El SDK de Gemini es síncrono por debajo (incluida la ejecución de las
    tools durante el function calling automático); se delega a un hilo
    aparte para no bloquear el event loop mientras se espera la respuesta.
    """
    return await asyncio.to_thread(generate, prompt, system_instruction)
