import { Layers } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asRecord, asStringArray } from "../utils";

const LEVEL_COLORS = ["text-primary", "text-secondary", "text-tertiary", "text-outline"] as const;

/** data: { categories: { [category: string]: string[] } } */
export function SkillsWidget({ widget }: { widget: Widget }) {
  const categories = asRecord(widget.data.categories);
  const entries = Object.entries(categories)
    .map(([category, skills]) => [category, asStringArray(skills)] as const)
    .filter(([, skills]) => skills.length > 0);

  if (entries.length === 0) return null;

  return (
    <WidgetCard title={widget.title ?? "Skills"} icon={<Layers size={14} aria-hidden="true" />}>
      <div className="space-y-3">
        {entries.map(([category, skills], index) => (
          <div
            key={category}
            className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-surface-container-low p-3 transition-colors hover:bg-surface-container"
          >
            <div className="min-w-0 flex-1">
              <p className="mb-1 font-label-sm uppercase tracking-wide text-on-surface-variant">{category}</p>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {skills.map((skill) => (
                  <span key={skill} className="font-body-md text-on-surface">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <span className={`shrink-0 font-label-sm uppercase ${LEVEL_COLORS[index % LEVEL_COLORS.length]}`}>
              {skills.length > 4 ? "Expert" : skills.length > 2 ? "Core" : "Lead"}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
