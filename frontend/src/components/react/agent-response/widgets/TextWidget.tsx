import { FileText } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asString } from "../utils";

/** data: { body: string } */
export function TextWidget({ widget }: { widget: Widget }) {
  const body = asString(widget.data.body) || asString(widget.data.text);
  if (!body) return null;

  const isProviderDetail = widget.id === "error-provider-detail";

  return (
    <WidgetCard title={widget.title ?? "Details"} icon={<FileText size={14} aria-hidden="true" />}>
      <p
        className={
          isProviderDetail
            ? "font-mono text-sm leading-relaxed text-on-surface-variant break-words whitespace-pre-wrap"
            : "font-body-md text-body-md leading-relaxed text-on-surface-variant"
        }
      >
        {body}
      </p>
    </WidgetCard>
  );
}
