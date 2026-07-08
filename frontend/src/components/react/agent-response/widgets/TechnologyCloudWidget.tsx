import { Cloud } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asStringArray } from "../utils";

/** data: { items: string[] } */
export function TechnologyCloudWidget({ widget }: { widget: Widget }) {
  const items = asStringArray(widget.data.items);
  if (items.length === 0) return null;

  return (
    <WidgetCard title={widget.title ?? "Technology"} icon={<Cloud size={16} aria-hidden="true" />}>
      <div className="flex flex-wrap gap-2">
        {items.map((tech) => (
          <span
            key={tech}
            className="rounded-full bg-secondary/10 px-3 py-1.5 text-label-sm text-secondary"
          >
            {tech}
          </span>
        ))}
      </div>
    </WidgetCard>
  );
}
