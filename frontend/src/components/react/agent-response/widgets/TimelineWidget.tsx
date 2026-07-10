import { History } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asArray, asRecord, asString } from "../utils";

interface TimelineItem {
  id: string;
  date: string;
  endDate: string;
  type: string;
  title: string;
  description: string;
}

const DOT_COLORS = ["bg-primary", "bg-secondary", "bg-tertiary"] as const;

function parseItem(raw: unknown, index: number): TimelineItem {
  const item = asRecord(raw);
  return {
    id: asString(item.id, `timeline-${index}`),
    date: asString(item.date),
    endDate: asString(item.endDate),
    type: asString(item.type),
    title: asString(item.title),
    description: asString(item.description),
  };
}

/** data: { items: [{ id, date, endDate, type, title, description }] } */
export function TimelineWidget({ widget }: { widget: Widget }) {
  const items = asArray(widget.data.items).map(parseItem);
  if (items.length === 0) return null;

  return (
    <WidgetCard title={widget.title ?? "Timeline"} icon={<History size={14} aria-hidden="true" />}>
      <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
        <div className="absolute left-0 top-5 hidden h-px w-full bg-white/5 md:block" aria-hidden="true" />
        {items.map((item, index) => (
          <div key={item.id} className="relative z-10 space-y-3">
            <div
              className={`mb-1 h-4 w-4 rounded-full border-4 border-background ${DOT_COLORS[index % DOT_COLORS.length]}`}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="font-headline-md text-on-surface">{item.title}</h3>
              <span className="whitespace-nowrap font-label-sm text-on-surface-variant">
                {item.date}
                {item.endDate ? ` — ${item.endDate}` : ""}
              </span>
            </div>
            {item.description && (
              <p className="font-body-md text-on-surface-variant">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
