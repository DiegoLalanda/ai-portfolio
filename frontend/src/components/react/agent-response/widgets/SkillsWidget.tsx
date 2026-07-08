import { Layers } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asRecord, asStringArray } from "../utils";

/** data: { categories: { [category: string]: string[] } } */
export function SkillsWidget({ widget }: { widget: Widget }) {
  const categories = asRecord(widget.data.categories);
  const entries = Object.entries(categories)
    .map(([category, skills]) => [category, asStringArray(skills)] as const)
    .filter(([, skills]) => skills.length > 0);

  if (entries.length === 0) return null;

  return (
    <WidgetCard title={widget.title ?? "Skills"} icon={<Layers size={16} aria-hidden="true" />}>
      <div className="flex flex-col gap-4">
        {entries.map(([category, skills]) => (
          <div key={category}>
            <p className="mb-2 text-label-sm uppercase tracking-wide text-on-surface-variant">{category}</p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-outline-variant/60 bg-surface-container px-2.5 py-1 text-label-sm text-on-surface"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
