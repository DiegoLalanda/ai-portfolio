import { useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { useReducedMotion } from "motion/react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { useResponseLocale } from "../ResponseLocaleContext";
import { asArray, asRecord, asString, asNumber } from "../utils";

interface LanguageItem {
  id: string;
  name: string;
  code: string;
  proficiency: string;
  proficiencyPercent: number;
}

function parseItem(raw: unknown, index: number): LanguageItem {
  const item = asRecord(raw);
  return {
    id: asString(item.id, `lang-${index}`),
    name: asString(item.name),
    code: asString(item.code),
    proficiency: asString(item.proficiency),
    proficiencyPercent: asNumber(item.proficiencyPercent, 0),
  };
}

const CEFR_COLORS: Record<string, { stroke: string; bg: string; label: string }> = {
  native: { stroke: "#d0bcff", bg: "rgba(208,188,255,0.15)", label: "Native" },
  C2: { stroke: "#9c8fee", bg: "rgba(156,143,238,0.15)", label: "C2" },
  C1: { stroke: "#7c6fd4", bg: "rgba(124,111,212,0.15)", label: "C1" },
  B2: { stroke: "#4d8fcc", bg: "rgba(77,143,204,0.15)", label: "B2" },
  B1: { stroke: "#3da882", bg: "rgba(61,168,130,0.15)", label: "B1" },
  A2: { stroke: "#6baa9a", bg: "rgba(107,170,154,0.15)", label: "A2" },
  A1: { stroke: "#8aa4a6", bg: "rgba(138,164,166,0.15)", label: "A1" },
};

function getColor(proficiency: string) {
  return CEFR_COLORS[proficiency] ?? CEFR_COLORS["A1"]!;
}

function LanguageRing({ item }: { item: LanguageItem }) {
  const reduced = useReducedMotion();
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const SIZE = 96;
  const STROKE = 7;
  const R = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const progress = animated ? item.proficiencyPercent / 100 : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const color = getColor(item.proficiency);

  useEffect(() => {
    if (reduced) {
      setAnimated(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setAnimated(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden="true"
          className="-rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color.stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{
              transition: reduced ? "none" : "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)",
              filter: `drop-shadow(0 0 5px ${color.stroke}80)`,
            }}
          />
        </svg>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-0.5"
          style={{ borderRadius: "50%", background: color.bg }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
            {item.code.toUpperCase()}
          </span>
          <span
            className="text-[16px] font-bold leading-none"
            style={{ color: color.stroke }}
          >
            {item.proficiency === "native" ? "—" : item.proficiency}
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[13px] font-medium text-on-surface">{item.name}</p>
        <p className="text-[11px] text-on-surface-variant">{item.proficiencyPercent}%</p>
      </div>
    </div>
  );
}

/** data: { items: [{ id, name, code, proficiency, proficiencyPercent }] } */
export function LanguagesWidget({ widget }: { widget: Widget }) {
  const locale = useResponseLocale();
  const defaultTitle = locale === "en" ? "Languages" : "Idiomas";

  const items = asArray(widget.data.items).map(parseItem);
  if (items.length === 0) return null;

  return (
    <WidgetCard title={widget.title ?? defaultTitle} icon={<Languages size={14} aria-hidden="true" />}>
      <div className="flex flex-wrap justify-center gap-6 sm:justify-start sm:gap-8">
        {items.map((item) => (
          <LanguageRing key={item.id} item={item} />
        ))}
      </div>
    </WidgetCard>
  );
}
