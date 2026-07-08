/**
 * Cliente mínimo para hablar con el backend FastAPI. Expone
 * `sendChatMessage`, que llama a `POST /api/v1/chat` y devuelve la
 * respuesta estructurada del agente (título, resumen, widgets, acciones
 * sugeridas). Ver `src/types/agent-response.ts` para el contrato completo.
 */

import type { AgentResponse } from "@/types/agent-response";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8000";

export type ChatResponse = AgentResponse;

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
