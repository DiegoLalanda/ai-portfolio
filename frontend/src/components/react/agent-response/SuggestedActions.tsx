import { motion, useReducedMotion } from "motion/react";
import { MessageCircleQuestion } from "lucide-react";
import type { SuggestedAction } from "@/types/agent-response";

interface SuggestedActionsProps {
  actions: SuggestedAction[];
  onAction: (action: SuggestedAction) => void;
}

/** Chips de follow-up: siempre reenvían una pregunta al agente. */
export function SuggestedActions({ actions, onAction }: SuggestedActionsProps) {
  const prefersReducedMotion = useReducedMotion();

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action, index) => (
        <motion.button
          key={`${action.action}-${action.payload}-${index}`}
          type="button"
          onClick={() => onAction(action)}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          className="secondary-btn flex items-center gap-2 rounded-full px-4 py-2 font-label-md text-label-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <MessageCircleQuestion size={14} aria-hidden="true" />
          {action.label}
        </motion.button>
      ))}
    </div>
  );
}
