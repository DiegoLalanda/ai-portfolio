/**
 * Cliente para hablar con el backend FastAPI.
 * Preferir `streamChatMessage` para loading en tiempo real con tools.
 */

import type { AgentResponse } from "@/types/agent-response";
import type { ChatStreamEvent } from "@/types/chat-stream";
import type { DashboardSessionContext } from "@/lib/dashboard-context";
import { getChatThreadId } from "@/lib/chat-thread";
import { ChatRequestError } from "@/lib/chat-errors";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8000";

export type ChatResponse = AgentResponse;

export interface ChatRequestBody {
  question: string;
  shown_widget_types?: string[];
  prior_questions?: string[];
  thread_id?: string;
}

export async function sendChatMessage(
  question: string,
  context: DashboardSessionContext = { shownWidgetTypes: [], priorQuestions: [] },
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      shown_widget_types: context.shownWidgetTypes,
      prior_questions: context.priorQuestions,
      thread_id: getChatThreadId(),
    } satisfies ChatRequestBody),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed with status ${response.status}`);
  }

  return (await response.json()) as ChatResponse;
}

export async function streamChatMessage(
  question: string,
  onEvent: (event: ChatStreamEvent) => void,
  context: DashboardSessionContext = { shownWidgetTypes: [], priorQuestions: [] },
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      question,
      shown_widget_types: context.shownWidgetTypes,
      prior_questions: context.priorQuestions,
      thread_id: getChatThreadId(),
    } satisfies ChatRequestBody),
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
      else if (body.detail != null) detail = JSON.stringify(body.detail);
    } catch {
      /* cuerpo vacío o no JSON */
    }
    const kind =
      response.status === 429 ? "rate_limit" : response.status >= 500 ? "gemini" : "connection";
    throw new ChatRequestError(`Chat stream failed with status ${response.status}`, kind, {
      detail,
      code: `http_${response.status}`,
    });
  }

  if (!response.body) {
    throw new Error("Chat stream returned an empty body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResponse: ChatResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk
        .split("\n")
        .find((entry) => entry.startsWith("data: "));
      if (!line) continue;

      const event = JSON.parse(line.slice(6)) as ChatStreamEvent;
      onEvent(event);

      if (event.type === "done") {
        finalResponse = event.response;
      }

      if (event.type === "error") {
        throw ChatRequestError.fromStreamEvent(event);
      }
    }
  }

  if (!finalResponse) {
    throw new Error("Chat stream ended without a final response");
  }

  return finalResponse;
}
