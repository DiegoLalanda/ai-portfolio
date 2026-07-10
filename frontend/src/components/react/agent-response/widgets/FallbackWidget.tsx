import { Sparkles } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";

/**
 * Degradación elegante para tipos desconocidos o errores de render.
 */
export function FallbackWidget({ widget }: { widget: Widget }) {
  return (
    <WidgetCard title={widget.title ?? "Extra content"} icon={<Sparkles size={14} aria-hidden="true" />}>
      <p className="font-body-md text-on-surface-variant">
        This part of the answer isn&apos;t available in this view yet.
      </p>
    </WidgetCard>
  );
}
