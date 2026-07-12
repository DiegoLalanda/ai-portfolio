import { motion, useReducedMotion } from "motion/react";
import { MessageCircleQuestion } from "lucide-react";
import type { SuggestedAction } from "@/types/agent-response";
import { cn } from "@/lib/utils";

interface SuggestedActionsProps {
  actions: SuggestedAction[];
  onAction: (action: SuggestedAction) => void;
}

/** Chips de follow-up: siempre reenvían una pregunta al agente. */
export function SuggestedActions({ actions, onAction }: SuggestedActionsProps) {
  const prefersReducedMotion = useReducedMotion();

  if (actions.length === 0) return null;

  const lastIndex = actions.length - 1;
  const spanFullWhenOdd = actions.length % 2 === 1;

  return (
    <div className="grid grid-cols-2 gap-2.5 md:flex md:flex-wrap md:gap-3">
      {actions.map((action, index) => (
        <motion.button
          key={`${action.action}-${action.payload}-${index}`}
          type="button"
          onClick={() => onAction(action)}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          className={cn(
            "secondary-btn flex w-full min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-label-md text-[13px] leading-snug text-on-surface-variant transition-colors hover:text-primary md:w-auto md:justify-start md:rounded-full md:px-4 md:py-2 md:text-label-sm",
            spanFullWhenOdd && index === lastIndex && "col-span-2",
          )}
        >
          <MessageCircleQuestion size={14} className="shrink-0" aria-hidden="true" />
          <span className="line-clamp-2 text-center md:text-left">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
