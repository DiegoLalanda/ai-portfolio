import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type AstroMascotProps = {
  className?: string;
  /** Tamaño visual del robot (contenedor cuadrado). */
  size?: "sm" | "md";
  /** Pulso activo mientras el asistente “piensa”. */
  active?: boolean;
};

/**
 * Robot mascota del asistente (SVG + animaciones; cola de viñeta va aparte).
 */
export function AstroMascot({ className, size = "md", active = false }: AstroMascotProps) {
  const rawId = useId().replace(/:/g, "");
  const gid = (name: string) => `${rawId}-${name}`;
  const prefersReducedMotion = useReducedMotion();
  const dim = size === "sm" ? "h-28 w-28 sm:h-32 sm:w-32" : "h-36 w-36 sm:h-40 sm:w-40";

  return (
    <div
      className={cn(
        "relative mx-auto shrink-0 select-none md:mx-0",
        !prefersReducedMotion && "astro-mascot-float",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-3 rounded-full bg-gradient-to-r from-secondary/25 via-primary/20 to-secondary/25 opacity-70 blur-2xl",
          !prefersReducedMotion && "astro-mascot-glow",
        )}
      />
      <svg
        className={cn(
          dim,
          "relative z-[1] drop-shadow-[0_10px_24px_rgba(76,215,246,0.28)]",
        )}
        viewBox="0 0 320 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label=""
      >
        <defs>
          <linearGradient id={gid("suit")} x1="110" y1="80" x2="210" y2="260" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#e0e7ff" />
            <stop offset="85%" stopColor="#c7d2fe" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
          <linearGradient id={gid("visor")} x1="120" y1="100" x2="200" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#080419" />
            <stop offset="50%" stopColor="#110c2c" />
            <stop offset="100%" stopColor="#0a192f" />
          </linearGradient>
          <linearGradient id={gid("jet")} x1="160" y1="230" x2="160" y2="275" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#4cd7f6" />
            <stop offset="70%" stopColor="#d0bcff" />
            <stop offset="100%" stopColor="rgba(168,85,247,0)" />
          </linearGradient>
          <filter id={gid("bloom")} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g className={!prefersReducedMotion ? "astro-mascot-jet" : undefined}>
          <path
            d="M144 232C144 232 152 272 160 274C168 272 176 232 176 232Z"
            fill={`url(#${gid("jet")})`}
          />
          <ellipse cx="160" cy="244" rx="7" ry="14" fill="#ffffff" opacity="0.9" />
        </g>

        <g className={!prefersReducedMotion ? "astro-mascot-arm-left" : undefined}>
          <rect x="92" y="172" width="18" height="36" rx="9" fill={`url(#${gid("suit")})`} stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" />
          <circle cx="101" cy="208" r="9" fill="#e0e7ff" stroke="#818cf8" strokeWidth="1.5" />
        </g>

        <g className={!prefersReducedMotion ? "astro-mascot-arm-wave" : undefined}>
          <rect x="210" y="170" width="18" height="36" rx="9" fill={`url(#${gid("suit")})`} stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" />
          <circle cx="219" cy="206" r="9" fill="#e0e7ff" stroke="#818cf8" strokeWidth="1.5" />
        </g>

        <rect x="122" y="166" width="76" height="70" rx="26" fill={`url(#${gid("suit")})`} stroke="rgba(168,85,247,0.35)" strokeWidth="2" />
        <g className={!prefersReducedMotion ? "astro-mascot-head" : undefined}>
          <line x1="160" y1="86" x2="160" y2="64" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
          <circle
            className={!prefersReducedMotion ? "astro-mascot-antenna" : undefined}
            cx="160"
            cy="60"
            r="6"
            fill="#4cd7f6"
            filter={`url(#${gid("bloom")})`}
          />
          <rect x="108" y="86" width="104" height="84" rx="34" fill={`url(#${gid("suit")})`} stroke="rgba(168,85,247,0.5)" strokeWidth="2.5" />
          <rect x="118" y="96" width="84" height="64" rx="24" fill={`url(#${gid("visor")})`} stroke="#4cd7f6" strokeWidth="1.8" />
          <g className={!prefersReducedMotion ? "astro-mascot-blink" : undefined}>
            <circle cx="144" cy="127" r="9" fill="#4cd7f6" filter={`url(#${gid("bloom")})`} />
            <circle cx="144" cy="127" r="4.5" fill="#ffffff" />
            <circle cx="176" cy="127" r="9" fill="#4cd7f6" filter={`url(#${gid("bloom")})`} />
            <circle cx="176" cy="127" r="4.5" fill="#ffffff" />
            <path d="M154 139C156 142 164 142 166 139" stroke="#4cd7f6" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </g>
      </svg>

      {active && !prefersReducedMotion && (
        <motion.span
          className="absolute bottom-3 right-2 flex h-3.5 w-3.5"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-background bg-secondary" />
        </motion.span>
      )}
    </div>
  );
}
