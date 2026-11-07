import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import type { Locale } from "@/i18n/types";
import { AstroMascot } from "./AstroMascot";

type MascotSpeechBubbleProps = {
  title: string;
  children: ReactNode;
  locale?: Locale;
  /** Muestra estado “pensando” en la viñeta. */
  thinking?: boolean;
  mascotSize?: "sm" | "md";
  footer?: ReactNode;
};

export function MascotSpeechBubble({
  title,
  children,
  thinking = false,
  mascotSize = "md",
  footer,
}: MascotSpeechBubbleProps) {
  return (
    <div className="mascot-speech-row w-full">
      <div className="mascot-speech-row__mascot">
        <AstroMascot size={mascotSize} active={thinking} />
        <div className="mascot-speech-badge mt-2 hidden sm:flex">
          <span className="mascot-speech-badge__dot" aria-hidden="true" />
          <span>Diego AI</span>
        </div>
      </div>

      <div className="mascot-speech-row__bubble mascot-speech-bubble min-w-0 flex-1">
        <div className="mb-3">
          <div className="section-label max-w-full truncate">
            <Sparkles size={14} aria-hidden="true" />
            <span className="truncate">{title}</span>
          </div>
        </div>

        <div className="font-body-md text-body-md leading-relaxed text-on-surface-variant">{children}</div>

        {footer ? <div className="mt-5 border-t border-white/5 pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
