import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Widget } from "@/types/agent-response";
import { SkillBadge } from "../SkillBadge";
import { getCategoryMeta } from "../skillIcons";
import { WidgetCard } from "../WidgetCard";
import { useResponseLocale } from "../ResponseLocaleContext";
import { asRecord, asStringArray } from "../utils";

/** Altura máxima para mostrar una sola fila de badges (icon + texto). */
const ONE_ROW_HEIGHT = "5.5rem";

function SkillCategory({
  category,
  skills,
  showMoreLabel,
  showLessLabel,
}: {
  category: string;
  skills: string[];
  showMoreLabel: string;
  showLessLabel: string;
}) {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const meta = getCategoryMeta(category);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const check = () => {
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize || "16");
      const limit = 6.5 * rootFontSize;
      // Comparamos la altura natural del contenido interno contra el límite de una fila (6.5rem)
      setHasOverflow(el.scrollHeight > limit + 4);
    };

    const obs = new ResizeObserver(check);
    obs.observe(el);
    check();
    return () => obs.disconnect();
  }, [skills]);

  return (
    <section className="skills-board__row min-w-0">
      <div className="mb-4 flex items-center gap-2.5">
        <span className={`h-1.5 w-1.5 rounded-full ${meta.accentDot}`} aria-hidden="true" />
        <h3 className={`font-label-md text-label-md uppercase tracking-[0.14em] ${meta.accentClass}`}>
          {meta.label}
        </h3>
        <span className="h-px flex-1 bg-white/5" aria-hidden="true" />
      </div>

      <motion.div
        animate={{ height: expanded ? "auto" : ONE_ROW_HEIGHT }}
        transition={reduced ? { duration: 0 } : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
        style={{ height: ONE_ROW_HEIGHT }}
      >
        <div ref={contentRef} className="grid grid-cols-4 gap-x-2 gap-y-5 sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-6">
          {skills.map((skill) => (
            <SkillBadge key={skill} name={skill} />
          ))}
        </div>
      </motion.div>

      {hasOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-[12px] text-on-surface-variant transition-colors hover:text-primary"
        >
          <ChevronDown
            size={13}
            className="transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden="true"
          />
          {expanded ? showLessLabel : showMoreLabel}
        </button>
      )}
    </section>
  );
}

/** data: { categories: { [category: string]: string[] } } */
export function SkillsWidget({ widget }: { widget: Widget }) {
  const locale = useResponseLocale();
  const categories = asRecord(widget.data.categories);
  const entries = Object.entries(categories)
    .map(([category, skills]) => [category, asStringArray(skills)] as const)
    .filter(([, skills]) => skills.length > 0);

  if (entries.length === 0) return null;

  const showMoreLabel = locale === "en" ? "Show more" : "Ver más";
  const showLessLabel = locale === "en" ? "Show less" : "Ver menos";

  return (
    <WidgetCard
      title={widget.title ?? (locale === "en" ? "Skills" : "Habilidades")}
      icon={<Layers size={14} aria-hidden="true" />}
    >
      <div className="skills-board flex flex-col gap-7 md:gap-8">
        {entries.map(([category, skills]) => (
          <SkillCategory
            key={category}
            category={category}
            skills={skills}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />
        ))}
      </div>
    </WidgetCard>
  );
}
