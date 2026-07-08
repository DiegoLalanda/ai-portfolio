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
    <WidgetCard title={widget.title ?? "Experience"} icon={<Briefcase size={16} aria-hidden="true" />}>
      <ul className="flex flex-col gap-5">
        {items.map((item) => (
          <li key={item.id} className="border-l-2 border-primary/30 pl-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-label-md text-body-md font-semibold text-on-surface">
                {item.role} <span className="text-on-surface-variant">·</span>{" "}
                <span className="text-primary">{item.company}</span>
              </p>
              <span className="whitespace-nowrap text-label-sm text-on-surface-variant">
                {item.startDate}
                {" — "}
                {item.current ? "Present" : item.endDate}
              </span>
            </div>
            {item.highlights.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-body-md text-on-surface-variant">
                {item.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
