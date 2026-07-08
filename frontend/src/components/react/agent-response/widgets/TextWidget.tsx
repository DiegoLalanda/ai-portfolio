import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asString } from "../utils";

/** data: { body: string } */
export function TextWidget({ widget }: { widget: Widget }) {
  const body = asString(widget.data.body);
  if (!body) return null;

  return (
    <WidgetCard title={widget.title}>
      <p className="font-body-md text-body-md text-on-surface-variant">{body}</p>
    </WidgetCard>
  );
}
