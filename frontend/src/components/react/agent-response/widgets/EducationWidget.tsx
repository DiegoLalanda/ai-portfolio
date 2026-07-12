import { GraduationCap } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { localizeEducationFields } from "@/lib/educationCopy";
import { TimelineRail, type TimelineRailItem } from "../TimelineRail";
import { WidgetCard } from "../WidgetCard";
import { useResponseLocale } from "../ResponseLocaleContext";
import { asArray, asRecord, asString, asStringArray } from "../utils";

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  status: string;
  highlights: string[];
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
    highlights: asStringArray(item.highlights),
  };
}

function formatDateLabel(item: EducationItem) {
  if (item.status) {
    const range =
      item.startDate || item.endDate
        ? ` · ${item.startDate}${item.endDate ? ` — ${item.endDate}` : ""}`
        : "";
    return `${item.status}${range}`;
  }
  return `${item.startDate} — ${item.endDate}`;
}

function EducationDetails({
  item,
  fieldLabel,
}: {
  item: EducationItem;
  fieldLabel: string;
}) {
  if (item.highlights.length === 0 && !item.fieldOfStudy) return null;

  return (
    <div className="space-y-3">
      {item.fieldOfStudy && (
        <p className="font-body-md text-on-surface-variant">
          {fieldLabel}: <span className="text-on-surface">{item.fieldOfStudy}</span>
        </p>
      )}
      {item.highlights.length > 0 && (
        <ul className="space-y-1.5">
          {item.highlights.map((highlight, i) => (
            <li key={i} className="flex gap-2 text-body-md text-on-surface-variant">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {highlight}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** data: { items: [{ id, institution, degree, fieldOfStudy, startDate, endDate, status, highlights? }] } */
export function EducationWidget({ widget }: { widget: Widget }) {
  const locale = useResponseLocale();
  const defaultTitle = locale === "en" ? "Education" : "Educación";
  const fieldLabel = locale === "en" ? "Field of study" : "Área de estudio";

  const items = asArray(widget.data.items)
    .map(parseItem)
    .map((item) => localizeEducationFields(item, locale));
  if (items.length === 0) return null;

  const railItems: TimelineRailItem[] = items.map((item) => {
    const hasDetails = item.highlights.length > 0 || Boolean(item.fieldOfStudy);
    return {
      id: item.id,
      title: item.degree,
      subtitle: item.institution,
      dateLabel: formatDateLabel(item),
      details: hasDetails ? <EducationDetails item={item} fieldLabel={fieldLabel} /> : undefined,
    };
  });

  return (
    <WidgetCard title={widget.title ?? defaultTitle} icon={<GraduationCap size={14} aria-hidden="true" />}>
      <TimelineRail items={railItems} defaultOpenFirst orientation="auto" seed={widget.id} />
    </WidgetCard>
  );
}
