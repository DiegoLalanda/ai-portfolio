import { Cloud } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asStringArray } from "../utils";

/** data: { items: string[] } */
export function TechnologyCloudWidget({ widget }: { widget: Widget }) {
  const items = asStringArray(widget.data.items);
  if (items.length === 0) return null;

  return (
    <WidgetCard title={widget.title ?? "Technology"} icon={<Cloud size={14} aria-hidden="true" />}>
      <div className="flex flex-wrap gap-2">
        {items.map((tech) => (
          <span
            key={tech}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-label-sm text-secondary transition-colors hover:border-secondary/30 hover:bg-secondary/10"
          >
            {tech}
          </span>
        ))}
      </div>
    </WidgetCard>
  );
}
