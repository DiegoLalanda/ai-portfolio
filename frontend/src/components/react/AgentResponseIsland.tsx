import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MessageCircleQuestion } from "lucide-react";
import { streamChatMessage } from "@/lib/api";
import type { AgentResponse, SuggestedAction } from "@/types/agent-response";
import {
  collectShownWidgetTypes,
  withFilteredSuggestions,
} from "@/lib/dashboard-context";
import { normalizeResponseLanguage } from "@/lib/responseLanguage";
import { AgentResponseView } from "@/components/react/agent-response/AgentResponseView";

type PendingAgentResponse = { response: AgentResponse; question: string };

function withResponseLanguage(response: AgentResponse, question: string): AgentResponse {
  return {
    ...response,
    language: normalizeResponseLanguage(response.language, question || response.summary || response.title),
  };
}

/**
 * Puente entre la orquestación en vanilla JS de HomePage y el árbol React
 * del dashboard. Acumula respuestas para que el reclutador arme el dashboard
 * con follow-ups (suggested actions) sin perder lo anterior.
 */
export default function AgentResponseIsland() {
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const latestRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const followUpLabel =
    typeof document !== "undefined"
      ? (document.getElementById("agent-response-container")?.dataset.followupLabel ?? "…")
      : "…";

  useEffect(() => {
    const responseBridge = window as Window & {
      __portfolioPendingAgentResponse?: PendingAgentResponse;
    };

    function handleReady(event: Event) {
      const detail = (event as CustomEvent<{ response?: AgentResponse; question?: string }>).detail;
      const response = detail?.response ?? (detail as unknown as AgentResponse);
      if (!response?.title) return;

      const initialQuestion =
        detail?.question ??
        (document.getElementById("submitted-question") as HTMLInputElement | null)?.value ??
        "";

      const filtered = withFilteredSuggestions(
        withResponseLanguage(response, initialQuestion),
        [],
      );
      setResponses([filtered]);
      setAskedQuestions(initialQuestion.trim() ? [initialQuestion.trim()] : []);
      setIsLoading(false);
      setPendingQuestion(null);
      delete responseBridge.__portfolioPendingAgentResponse;
    }

    function handleReset() {
      delete responseBridge.__portfolioPendingAgentResponse;
      setResponses([]);
      setAskedQuestions([]);
      setIsLoading(false);
      setPendingQuestion(null);
    }

    window.addEventListener("agent-response:ready", handleReady);
    window.addEventListener("mock-chat:submit", handleReset);
    window.addEventListener("portfolio:reset", handleReset);

    const pending = responseBridge.__portfolioPendingAgentResponse;
    if (pending) {
      handleReady(new CustomEvent("agent-response:ready", { detail: pending }));
    }

    return () => {
      window.removeEventListener("agent-response:ready", handleReady);
      window.removeEventListener("mock-chat:submit", handleReset);
      window.removeEventListener("portfolio:reset", handleReset);
    };
  }, []);

  useEffect(() => {
    if (isLoading && loaderRef.current) {
      loaderRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && responses.length > 1 && latestRef.current) {
      latestRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [responses, isLoading]);

  async function runFollowUp(question: string) {
    if (isLoading) return;

    const shownWidgetTypes = collectShownWidgetTypes(responses);
    const priorQuestions = askedQuestions;

    setIsLoading(true);
    setPendingQuestion(question);
    setAskedQuestions((prev) => [...prev, question]);
    document.getElementById("page-root")?.classList.add("is-thinking");

    try {
      const data = await streamChatMessage(
        question,
        () => {
          /* follow-up: solo spinner circular */
        },
        { shownWidgetTypes, priorQuestions },
      );
      const filtered = withFilteredSuggestions(
        withResponseLanguage(data, question),
        shownWidgetTypes,
      );
      setResponses((prev) => [...prev, filtered]);
    } catch (error: any) {
      console.error("Error en follow-up:", error);
      const pageRoot = document.getElementById("page-root");
      
      const isRateLimit = error.message?.includes("429") || error.message?.includes("Demasiadas preguntas");
      const title = isRateLimit 
        ? (pageRoot?.dataset.ratelimitTitle ?? "Límite de preguntas superado")
        : (pageRoot?.dataset.errorTitle ?? "Connection issue");
      const summary = isRateLimit
        ? (pageRoot?.dataset.ratelimitSummary ?? "Has superado el límite de 10 preguntas por minuto. Por favor, espera un momento antes de volver a preguntar.")
        : (pageRoot?.dataset.errorSummary ?? "Couldn't reach the backend right now. Please make sure the API is running.");

      const fallback: AgentResponse = {
        language: (pageRoot?.dataset.locale as any) === "en" ? "en" : "es",
        title,
        summary,
        widgets: isRateLimit ? [
          {
            id: "rate-limit-cv-download",
            type: "text" as any,
            title: null,
            data: {
              text: "",
            }
          }
        ] : [],
        suggested_actions: [],
      };
      setResponses((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
      setPendingQuestion(null);
      document.getElementById("page-root")?.classList.remove("is-thinking");
    }
  }

  function handleAction(action: SuggestedAction) {
    if (action.action === "ask") {
      void runFollowUp(action.payload);
    } else if (action.action === "link") {
      window.open(action.payload, "_blank");
    }
  }

  if (responses.length === 0 && !isLoading) return null;

  const shownWidgetTypes = collectShownWidgetTypes(responses);
  const latestResponse = responses[responses.length - 1];
  const latestFilteredActions = latestResponse
    ? withFilteredSuggestions(latestResponse, shownWidgetTypes).suggested_actions
    : [];
  const showAskAgain = !isLoading && latestFilteredActions.length === 0;
  const askAgainLabel =
    typeof document !== "undefined"
      ? (document.getElementById("agent-response-container")?.dataset.askAgainLabel ?? "Ask again")
      : "Ask again";
  const askAgainAriaLabel =
    typeof document !== "undefined"
      ? (document.getElementById("agent-response-container")?.dataset.askAgainAriaLabel ?? askAgainLabel)
      : askAgainLabel;

  return (
    <div className="mx-auto flex w-full max-w-container-max flex-col gap-gutter">
      {responses.map((response, index) => {
        const isLatest = index === responses.length - 1;
        const displayResponse = isLatest
          ? withFilteredSuggestions(response, shownWidgetTypes)
          : { ...response, suggested_actions: [] };

        return (
          <AgentResponseView
            key={`${response.title}-${index}`}
            response={displayResponse}
            locale={displayResponse.language === "en" ? "en" : "es"}
            onAction={handleAction}
            showActions={isLatest && !isLoading}
            anchorRef={isLatest ? latestRef : undefined}
          />
        );
      })}

      {isLoading && (
        <div
          ref={loaderRef}
          className="dashboard-followup-loader glass-panel flex flex-col items-center justify-center gap-4 rounded-xl px-6 py-10"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="dashboard-followup-spinner" aria-hidden="true" />
          <p className="font-label-md text-label-md uppercase tracking-widest text-primary">{followUpLabel}</p>
          {pendingQuestion && (
            <p className="max-w-md text-center font-body-md text-body-md text-on-surface-variant">
              {pendingQuestion}
            </p>
          )}
        </div>
      )}

      {showAskAgain && (
        <div className="flex justify-center pb-2">
          <motion.button
            type="button"
            aria-label={askAgainAriaLabel}
            onClick={() => window.dispatchEvent(new CustomEvent("portfolio:ask-again"))}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            className="secondary-btn flex items-center gap-2 rounded-full px-5 py-2.5 font-label-md text-label-sm text-on-surface-variant transition-colors hover:text-primary"
          >
            <MessageCircleQuestion size={15} aria-hidden="true" />
            {askAgainLabel}
          </motion.button>
        </div>
      )}
    </div>
  );
}
