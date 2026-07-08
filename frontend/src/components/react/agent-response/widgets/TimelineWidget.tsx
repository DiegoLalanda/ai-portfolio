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
    <WidgetCard title={widget.title ?? "Timeline"} icon={<History size={16} aria-hidden="true" />}>
      <ol className="relative flex flex-col gap-5 border-l-2 border-outline-variant/60 pl-5">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(208,188,255,0.6)]" />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-label-md text-body-md font-semibold text-on-surface">{item.title}</p>
              <span className="whitespace-nowrap text-label-sm text-on-surface-variant">
                {item.date}
                {item.endDate ? ` — ${item.endDate}` : ""}
              </span>
            </div>
            {item.description && (
              <p className="mt-1 text-body-md text-on-surface-variant">{item.description}</p>
            )}
          </li>
        ))}
      </ol>
    </WidgetCard>
  );
}
