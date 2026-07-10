import { FileText } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asString } from "../utils";

/** data: { body: string } */
export function TextWidget({ widget }: { widget: Widget }) {
  const body = asString(widget.data.body);
  if (!body) return null;

  return (
    <WidgetCard title={widget.title ?? "Details"} icon={<FileText size={14} aria-hidden="true" />}>
      <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">{body}</p>
    </WidgetCard>
  );
}
