import { GraduationCap } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asArray, asRecord, asString } from "../utils";

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  status: string;
}

function parseItem(raw: unknown, index: number): EducationItem {
  const item = asRecord(raw);
  return {
    id: asString(item.id, `education-${index}`),
    institution: asString(item.institution),
    degree: asString(item.degree),
    fieldOfStudy: asString(item.fieldOfStudy),
    startDate: asString(item.startDate),
    endDate: asString(item.endDate),
    status: asString(item.status),
  };
}

/** data: { items: [{ id, institution, degree, fieldOfStudy, startDate, endDate, status }] } */
export function EducationWidget({ widget }: { widget: Widget }) {
  const items = asArray(widget.data.items).map(parseItem);
  if (items.length === 0) return null;

  return (
    <WidgetCard title={widget.title ?? "Education"} icon={<GraduationCap size={14} aria-hidden="true" />}>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 rounded-lg border border-white/5 bg-surface-container-low p-4 transition-colors hover:bg-surface-container"
          >
            <div>
              <p className="font-label-md text-body-md font-semibold text-on-surface">
                {item.degree}
                {item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ""}
              </p>
              <p className="text-body-md text-on-surface-variant">{item.institution}</p>
            </div>
            <span className="whitespace-nowrap font-label-sm text-primary">
              {item.status || `${item.startDate} — ${item.endDate}`}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
