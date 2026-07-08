import { useEffect, useState } from "react";
import type { AgentResponse, SuggestedAction } from "@/types/agent-response";
import { AgentResponseView } from "@/components/react/agent-response/AgentResponseView";

/**
 * Puente entre la orquestación en vanilla JS de `index.astro` (que maneja
 * las fases landing/processing/dashboard) y el árbol de React que renderiza
 * el contrato estructurado del agente. Se comunica exclusivamente por
 * `CustomEvent`s en `window`, igual que el resto de los componentes de esta
 * página, así no queda acoplado a la implementación del script de la página.
 *
 * Eventos que escucha:
 * - "agent-response:ready" (`detail: AgentResponse`): la respuesta a renderizar.
 * - "mock-chat:submit": una pregunta nueva se está enviando; limpia la
 *   respuesta anterior para no mostrarla brevemente al reabrir el dashboard.
 *
 * Eventos que dispara:
 * - "mock-chat:submit" (`detail: { question }`): al activar una suggested
 *   action de tipo "ask", reutiliza el mismo flujo que si el visitante
 *   hubiera escrito esa pregunta.
 */
export default function AgentResponseIsland() {
  const [response, setResponse] = useState<AgentResponse | null>(null);

  useEffect(() => {
    function handleReady(event: Event) {
      const detail = (event as CustomEvent<AgentResponse>).detail;
      if (detail) setResponse(detail);
    }

    function handleReset() {
      setResponse(null);
    }

    window.addEventListener("agent-response:ready", handleReady);
    window.addEventListener("mock-chat:submit", handleReset);
    return () => {
      window.removeEventListener("agent-response:ready", handleReady);
      window.removeEventListener("mock-chat:submit", handleReset);
    };
  }, []);

  function handleAction(action: SuggestedAction) {
    switch (action.action) {
      case "ask":
        window.dispatchEvent(new CustomEvent("mock-chat:submit", { detail: { question: action.payload } }));
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

  if (!response) return null;

  return <AgentResponseView response={response} onAction={handleAction} />;
}
