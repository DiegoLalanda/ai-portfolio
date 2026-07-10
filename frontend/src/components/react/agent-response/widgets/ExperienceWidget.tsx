import { Briefcase } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asArray, asRecord, asString, asStringArray } from "../utils";

interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
}

function parseItem(raw: unknown, index: number): ExperienceItem {
  const item = asRecord(raw);
  return {
    id: asString(item.id, `experience-${index}`),
    role: asString(item.role),
    company: asString(item.company),
    startDate: asString(item.startDate),
    endDate: asString(item.endDate),
    current: item.current === true,
    highlights: asStringArray(item.highlights),
  };
}

/** data: { items: [{ id, role, company, startDate, endDate, current, highlights }] } */
export function ExperienceWidget({ widget }: { widget: Widget }) {
  const items = asArray(widget.data.items).map(parseItem);
  if (items.length === 0) return null;

  return (
    <WidgetCard title={widget.title ?? "Experience"} icon={<Briefcase size={14} aria-hidden="true" />}>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:border-primary/20"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-label-md text-body-md font-semibold text-on-surface">
                {item.role} <span className="text-on-surface-variant">·</span>{" "}
                <span className="text-primary">{item.company}</span>
              </p>
              <span className="whitespace-nowrap font-label-sm text-on-surface-variant">
                {item.startDate}
                {" — "}
                {item.current ? "Present" : item.endDate}
              </span>
            </div>
            {item.highlights.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                {item.highlights.map((highlight, i) => (
                  <li key={i} className="flex gap-2 text-body-md text-on-surface-variant">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {highlight}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
