import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import type { AgentResponse, SuggestedAction } from "@/types/agent-response";
import { WidgetRenderer } from "./WidgetRenderer";
import { SuggestedActions } from "./SuggestedActions";

interface AgentResponseViewProps {
  response: AgentResponse;
  onAction: (action: SuggestedAction) => void;
}

/** Raíz visual de una respuesta del agente: título + resumen (siempre presentes) y, opcionalmente, widgets y acciones sugeridas debajo. */
export function AgentResponseView({ response, onAction }: AgentResponseViewProps) {
  const prefersReducedMotion = useReducedMotion();

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  return (
    <motion.div
      className="glass-panel rounded-xl p-6 text-left"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="section-label mb-3" variants={itemVariants}>
        <Sparkles size={14} aria-hidden="true" />
        {response.title}
      </motion.div>

      <motion.p className="font-body-md text-body-md text-on-surface-variant" variants={itemVariants}>
        {response.summary}
      </motion.p>

      {response.widgets.length > 0 && (
        <motion.div className="mt-6 flex flex-col gap-4" variants={containerVariants}>
          {response.widgets.map((widget) => (
            <motion.div key={widget.id} variants={itemVariants}>
              <WidgetRenderer widget={widget} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <SuggestedActions actions={response.suggested_actions} onAction={onAction} />
      </motion.div>
    </motion.div>
  );
}
