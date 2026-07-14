import { useState } from "react";
import { ChevronDown, HeartHandshake } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { useResponseLocale } from "../ResponseLocaleContext";
import { asArray, asRecord, asString } from "../utils";

interface SoftSkillItem {
  id: string;
  name: string;
  description: string;
}

function parseItem(raw: unknown, index: number): SoftSkillItem {
  const item = asRecord(raw);
  return {
    id: asString(item.id, `soft-${index}`),
    name: asString(item.name),
    description: asString(item.description),
  };
}

function SoftSkillChip({ item }: { item: SoftSkillItem }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-left transition-colors hover:border-primary/20 hover:bg-white/[0.05]"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <span className="flex-1 text-[13px] font-medium text-on-surface">{item.name}</span>
        {item.description && (
          <ChevronDown
            size={13}
            className="shrink-0 text-on-surface-variant transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden="true"
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && item.description && (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-3 pt-2 text-[12px] leading-relaxed text-on-surface-variant">
              {item.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** data: { items: [{ id, name, description }] } */
export function SoftSkillsWidget({ widget }: { widget: Widget }) {
  const locale = useResponseLocale();
  const defaultTitle = locale === "en" ? "Soft Skills" : "Habilidades blandas";

  const items = asArray(widget.data.items).map(parseItem);
  if (items.length === 0) return null;

  return (
    <WidgetCard
      title={widget.title ?? defaultTitle}
      icon={<HeartHandshake size={14} aria-hidden="true" />}
    >
      <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <SoftSkillChip key={item.id} item={item} />
        ))}
      </div>
    </WidgetCard>
  );
}
