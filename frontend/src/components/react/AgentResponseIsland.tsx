import { useEffect, useRef, useState } from "react";
import { streamChatMessage } from "@/lib/api";
import type { AgentResponse, SuggestedAction } from "@/types/agent-response";
import { AgentResponseView } from "@/components/react/agent-response/AgentResponseView";

/**
 * Puente entre la orquestación en vanilla JS de HomePage y el árbol React
 * del dashboard. Acumula respuestas para que el reclutador arme el dashboard
 * con follow-ups (suggested actions) sin perder lo anterior.
 *
 * Eventos que escucha:
 * - "agent-response:ready": primera respuesta (o reset + set desde HomePage).
 * - "mock-chat:submit": pregunta nueva desde landing; limpia el stack.
 *
 * Follow-ups "ask" se resuelven acá: loader circular + append abajo.
 */
export default function AgentResponseIsland() {
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const latestRef = useRef<HTMLDivElement | null>(null);
  const followUpLabel =
    typeof document !== "undefined"
      ? (document.getElementById("agent-response-container")?.dataset.followupLabel ?? "…")
      : "…";

  useEffect(() => {
    function handleReady(event: Event) {
      const detail = (event as CustomEvent<AgentResponse>).detail;
      if (!detail) return;
      setResponses([detail]);
      setIsLoading(false);
      setPendingQuestion(null);
    }

    function handleReset() {
      setResponses([]);
      setIsLoading(false);
      setPendingQuestion(null);
    }

    window.addEventListener("agent-response:ready", handleReady);
    window.addEventListener("mock-chat:submit", handleReset);
    return () => {
      window.removeEventListener("agent-response:ready", handleReady);
      window.removeEventListener("mock-chat:submit", handleReset);
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

    setIsLoading(true);
    setPendingQuestion(question);
    document.getElementById("page-root")?.classList.add("is-thinking");

    try {
      const data = await streamChatMessage(question, () => {
        /* follow-up: solo spinner circular, sin LoadingPanel */
      });
      setResponses((prev) => [...prev, data]);
    } catch (error) {
      console.error("Error en follow-up:", error);
      const pageRoot = document.getElementById("page-root");
      const fallback: AgentResponse = {
        title: pageRoot?.dataset.errorTitle ?? "Connection issue",
        summary:
          pageRoot?.dataset.errorSummary ??
          "Couldn't reach the backend right now. Please make sure the API is running.",
        widgets: [],
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
    switch (action.action) {
      case "ask":
        void runFollowUp(action.payload);
        break;
      case "link":
        window.open(action.payload, "_blank", "noopener,noreferrer");
        break;
      case "contact":
        if (action.payload.includes("@")) {
          window.location.href = `mailto:${action.payload}`;
        } else if (action.payload.startsWith("http")) {
          window.open(action.payload, "_blank", "noopener,noreferrer");
        }
        break;
    }
  }

  if (responses.length === 0 && !isLoading) return null;

  return (
    <div className="mx-auto flex w-full max-w-container-max flex-col gap-gutter">
      {responses.map((response, index) => {
        const isLatest = index === responses.length - 1;
        return (
          <AgentResponseView
            key={`${response.title}-${index}`}
            response={response}
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
    </div>
  );
}
