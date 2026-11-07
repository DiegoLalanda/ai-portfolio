import type { AgentResponse } from "@/types/agent-response";
import type { ChatStreamEvent } from "@/types/chat-stream";
import type { Locale } from "@/i18n/types";

export type ChatErrorKind =
  | "timeout"
  | "gemini"
  | "rate_limit"
  | "connection"
  | "generic";

export interface ChatErrorLabels {
  timeoutTitle: string;
  timeoutSummary: string;
  geminiTitle: string;
  geminiSummary: string;
  geminiDetailLabel: string;
  rateLimitTitle: string;
  rateLimitSummary: string;
  connectionTitle: string;
  connectionSummary: string;
  genericTitle: string;
  genericSummary: string;
}

export class ChatRequestError extends Error {
  readonly kind: ChatErrorKind;
  readonly detail?: string;
  readonly code?: string;

  constructor(
    message: string,
    kind: ChatErrorKind,
    options?: { detail?: string; code?: string },
  ) {
    super(message);
    this.name = "ChatRequestError";
    this.kind = kind;
    this.detail = options?.detail;
    this.code = options?.code;
  }

  static fromStreamEvent(event: Extract<ChatStreamEvent, { type: "error" }>): ChatRequestError {
    const kind = streamCodeToKind(event.code, event.message);
    return new ChatRequestError(event.message, kind, {
      detail: event.detail,
      code: event.code,
    });
  }
}

function streamCodeToKind(code: string | undefined, message: string): ChatErrorKind {
  switch (code) {
    case "llm_timeout":
      return "timeout";
    case "gemini_api":
    case "gemini_capacity":
    case "invalid_response":
      return "gemini";
    case "generation_failed":
    case "stream_failed":
      return classifyMessage(message);
    default:
      return classifyMessage(message);
  }
}

function classifyMessage(message: string): ChatErrorKind {
  const text = message.toLowerCase();
  if (
    text.includes("tardó demasiado") ||
    text.includes("tardo demasiado") ||
    text.includes("took too long")
  ) {
    return "timeout";
  }
  if (text.includes("demasiadas preguntas") || message.includes("429")) {
    return "rate_limit";
  }
  if (
    text.includes("cuota o límite de gemini") ||
    text.includes("gemini quota") ||
    text.includes("high demand") ||
    text.includes("gemini api error") ||
    text.includes("gemini no pudo") ||
    text.includes("no pudimos generar una respuesta") ||
    text.includes("could not generate") ||
    text.includes("resource_exhausted") ||
    text.includes("serviceunavailable")
  ) {
    return "gemini";
  }
  if (
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network request failed") ||
    text.includes("load failed")
  ) {
    return "connection";
  }
  if (message.includes("Chat stream failed") || message.includes("Chat request failed")) {
    if (message.includes("429")) return "rate_limit";
    if (message.includes("502") || message.includes("503") || message.includes("504")) {
      return "gemini";
    }
    return "connection";
  }
  return "generic";
}

export function classifyChatError(error: unknown): ChatRequestError {
  if (error instanceof ChatRequestError) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  return new ChatRequestError(message, classifyMessage(message));
}

function detailWidget(
  detail: string | undefined,
  title: string,
): AgentResponse["widgets"] {
  const trimmed = detail?.trim();
  if (!trimmed) return [];
  return [
    {
      id: "error-provider-detail",
      type: "text",
      title,
      data: { body: trimmed },
    },
  ];
}

export function buildChatErrorResponse(
  locale: Locale,
  error: unknown,
  labels: ChatErrorLabels,
): AgentResponse {
  const classified = classifyChatError(error);
  const language = locale;

  switch (classified.kind) {
    case "timeout":
      return {
        language,
        title: labels.timeoutTitle,
        summary: labels.timeoutSummary,
        widgets: classified.detail
          ? detailWidget(classified.detail, labels.geminiDetailLabel)
          : [],
        suggested_actions: [],
      };
    case "gemini":
      return {
        language,
        title: labels.geminiTitle,
        summary: classified.message || labels.geminiSummary,
        widgets: detailWidget(classified.detail ?? classified.message, labels.geminiDetailLabel),
        suggested_actions: [],
      };
    case "rate_limit":
      return {
        language,
        title: labels.rateLimitTitle,
        summary: labels.rateLimitSummary,
        widgets: [
          {
            id: "rate-limit-cv-download",
            type: "text",
            title: null,
            data: { text: "" },
          },
        ],
        suggested_actions: [],
      };
    case "connection":
      return {
        language,
        title: labels.connectionTitle,
        summary: labels.connectionSummary,
        widgets: [],
        suggested_actions: [],
      };
    default:
      return {
        language,
        title: labels.genericTitle,
        summary: classified.message || labels.genericSummary,
        widgets: detailWidget(classified.detail, labels.geminiDetailLabel),
        suggested_actions: [],
      };
  }
}

export function readChatErrorLabelsFromDom(locale: Locale): ChatErrorLabels {
  const root = document.getElementById("page-root");
  const en = locale === "en";
  return {
    timeoutTitle: root?.dataset.timeoutTitle ?? (en ? "Model took too long" : "El modelo tardó demasiado"),
    timeoutSummary:
      root?.dataset.timeoutSummary ??
      (en
        ? "Gemini did not respond in time. Try again in a few seconds."
        : "Gemini no respondió a tiempo. Podés reintentar en unos segundos."),
    geminiTitle: root?.dataset.geminiTitle ?? (en ? "Gemini unavailable" : "Gemini no respondió"),
    geminiSummary:
      root?.dataset.geminiSummary ??
      (en
        ? "The model provider rejected or could not complete the request."
        : "El proveedor del modelo no pudo completar la solicitud."),
    geminiDetailLabel:
      root?.dataset.geminiDetailLabel ?? (en ? "Provider detail" : "Detalle de Gemini"),
    rateLimitTitle:
      root?.dataset.ratelimitTitle ??
      (en ? "Rate limit exceeded" : "Límite de preguntas superado"),
    rateLimitSummary:
      root?.dataset.ratelimitSummary ??
      (en
        ? "You exceeded the limit of 10 questions per minute. Wait a moment and try again."
        : "Superaste el límite de 10 preguntas por minuto. Esperá un momento antes de reintentar."),
    connectionTitle: root?.dataset.errorTitle ?? (en ? "Connection issue" : "Problema de conexión"),
    connectionSummary:
      root?.dataset.errorSummary ??
      (en
        ? "Could not reach the API. Check your connection or try again."
        : "No pudimos contactar la API. Revisá tu conexión o intentá de nuevo."),
    genericTitle: root?.dataset.genericTitle ?? (en ? "Something went wrong" : "No pudimos responder"),
    genericSummary:
      root?.dataset.genericSummary ??
      (en ? "Please try again in a moment." : "Intentá de nuevo en un momento."),
  };
}
