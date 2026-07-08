import { Sparkles } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";

/**
 * Se usa cuando `widget.type` no está registrado en `widgetRegistry.ts`
 * (tipo desconocido) o cuando un widget conocido explota al renderizar
 * (ver `WidgetErrorBoundary` en `WidgetRenderer.tsx`). Nunca debe verse
 * como un error: es una degradación elegante, no una pantalla rota.
 */
export function FallbackWidget({ widget }: { widget: Widget }) {
  return (
    <WidgetCard title={widget.title ?? "Extra content"} icon={<Sparkles size={16} aria-hidden="true" />}>
      <p className="text-body-md text-on-surface-variant">
        This part of the answer isn&apos;t available in this view yet.
      </p>
    </WidgetCard>
  );
}
