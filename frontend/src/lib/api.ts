/**
 * Cliente mínimo para hablar con el backend FastAPI. Por ahora solo expone
 * `sendChatMessage`, que llama a `POST /api/v1/chat` (todavía mockeado, sin
 * Gemini conectado) para verificar el round-trip completo frontend-backend.
 */

const API_BASE_URL = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8000";

export interface ChatResponse {
  answer: string;
}

export async function sendChatMessage(question: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed with status ${response.status}`);
  }

  return (await response.json()) as ChatResponse;
}
