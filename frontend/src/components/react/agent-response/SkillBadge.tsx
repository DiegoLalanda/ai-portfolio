import { useEffect, useMemo, useState } from "react";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLucideIcon,
  resolveSkillIcon,
  shouldInvertIcon,
  skillIconUrls,
  type SkillIconRef,
} from "./skillIcons";

interface SkillBadgeProps {
  name: string;
}

/** Logo (Devicon / Simple Icons / Lucide) + nombre. */
export function SkillBadge({ name }: SkillBadgeProps) {
  const ref = useMemo(() => resolveSkillIcon(name), [name]);
  const candidates = useMemo(() => (ref ? skillIconUrls(ref) : []), [ref]);
  const [urlIndex, setUrlIndex] = useState(0);
  const activeUrl = candidates[urlIndex] ?? null;
  const invert = shouldInvertIcon(ref);

  useEffect(() => {
    setUrlIndex(0);
  }, [name]);

  return (
    <div className="group flex flex-col items-center gap-1.5 sm:w-[5.5rem] sm:gap-2.5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0c0c0e] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors group-hover:border-white/20 group-hover:bg-[#121216] sm:h-16 sm:w-16">
        <SkillGlyph
          refIcon={ref}
          activeUrl={activeUrl}
          invert={invert}
          onImageError={() => {
            setUrlIndex((current) => (current + 1 < candidates.length ? current + 1 : candidates.length));
          }}
        />
      </div>
      <span className="line-clamp-2 min-h-[2.2em] text-center text-[11px] leading-tight text-on-surface-variant transition-colors group-hover:text-on-surface sm:font-label-sm">
        {formatSkillLabel(name)}
      </span>
    </div>
  );
}

function SkillGlyph({
  refIcon,
  activeUrl,
  invert,
  onImageError,
}: {
  refIcon: SkillIconRef | null;
  activeUrl: string | null;
  invert: boolean;
  onImageError: () => void;
}) {
  if (refIcon?.provider === "lucide") {
    const Icon = getLucideIcon(refIcon.icon);
    return <Icon className="h-6 w-6 text-on-surface sm:h-9 sm:w-9" strokeWidth={1.5} aria-hidden="true" />;
  }

  if (activeUrl) {
    return (
      <img
        key={activeUrl}
        src={activeUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn("h-6 w-6 object-contain sm:h-9 sm:w-9", invert && "brightness-0 invert")}
        onError={onImageError}
      />
    );
  }

  return (
    <Box className="h-6 w-6 text-on-surface-variant sm:h-9 sm:w-9" strokeWidth={1.5} aria-hidden="true" />
  );
}

function formatSkillLabel(name: string) {
  return name.replace(/^skill-/, "").replaceAll("-", " ");
}
