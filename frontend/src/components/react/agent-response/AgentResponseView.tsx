import { motion, useReducedMotion } from "motion/react";
import { Sparkles, Download } from "lucide-react";
import type { Ref } from "react";
import type { AgentResponse, SuggestedAction } from "@/types/agent-response";
import type { Locale } from "@/i18n/types";
import { WidgetRenderer } from "./WidgetRenderer";
import { SuggestedActions } from "./SuggestedActions";
import { ResponseLocaleContext } from "./ResponseLocaleContext";

interface AgentResponseViewProps {
  response: AgentResponse;
  onAction: (action: SuggestedAction) => void;
  /** Solo el bloque más reciente muestra suggested actions. */
  showActions?: boolean;
  /** Ref al primer bloque (para scroll en follow-ups). */
  anchorRef?: Ref<HTMLDivElement>;
  /** Idioma de esta respuesta (widgets + i18n de catálogo). */
  locale?: Locale;
}

/**
 * Bloques de una respuesta. Sin wrapper con gap propio: el espaciado
 * lo controla el island padre para que sea parejo entre respuestas.
 */
export function AgentResponseView({
  response,
  onAction,
  showActions = true,
  anchorRef,
  locale = "es",
}: AgentResponseViewProps) {
  const prefersReducedMotion = useReducedMotion();

  const isCvDownloadWidget = (id: string) =>
    id.startsWith("cv-download") || id.startsWith("rate-limit-cv-download");
  const showCvDownload = response.widgets.some((widget) => isCvDownloadWidget(widget.id));
  const filteredWidgets = response.widgets.filter((widget) => !isCvDownloadWidget(widget.id));

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <ResponseLocaleContext.Provider value={locale}>
      <motion.div
        ref={anchorRef}
        className="glass-panel rounded-xl px-6 py-5 text-left md:px-8 md:py-6"
        initial="hidden"
        animate="visible"
        variants={itemVariants}
      >
        <div className="section-label mb-3">
          <Sparkles size={14} aria-hidden="true" />
          {response.title}
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">{response.summary}</p>

        {showCvDownload && (
          <div className="mt-5">
            <a
              href="/CV-Diego Lalanda-2025.pdf"
              download="CV-Diego Lalanda-2025.pdf"
              className="primary-btn inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 font-label-md text-label-sm text-on-primary bg-primary hover:bg-primary/95 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg"
            >
              <Download size={15} aria-hidden="true" />
              {locale === "en" ? "Download Full CV" : "Descargar CV Completo"}
            </a>
          </div>
        )}
      </motion.div>

      {filteredWidgets.map((widget, index) => (
        <motion.div
          key={widget.id}
          className="dashboard-reveal"
          style={{ animationDelay: `${0.06 + index * 0.08}s` }}
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <WidgetRenderer widget={widget} />
        </motion.div>
      ))}

      {showActions && response.suggested_actions.length > 0 && (
        <motion.div
          className="glass-panel rounded-xl px-6 py-5 md:px-8 md:py-6"
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <SuggestedActions actions={response.suggested_actions} onAction={onAction} />
        </motion.div>
      )}
    </ResponseLocaleContext.Provider>
  );
}
