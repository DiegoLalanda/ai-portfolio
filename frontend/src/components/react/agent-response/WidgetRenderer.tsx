import { Component, type ErrorInfo, type ReactNode } from "react";
import type { Widget } from "@/types/agent-response";
import { widgetRegistry } from "./widgetRegistry";
import { FallbackWidget } from "./widgets/FallbackWidget";

interface WidgetErrorBoundaryProps {
  widget: Widget;
  children: ReactNode;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
}

/**
 * Si un widget "conocido" explota al renderizar (datos con una forma
 * inesperada, etc.) no debe tirar abajo el resto del dashboard: se degrada
 * a `FallbackWidget`, igual que un `type` desconocido.
 */
class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  state: WidgetErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Widget "${this.props.widget.type}" failed to render:`, error, info);
  }

  render() {
    if (this.state.hasError) return <FallbackWidget widget={this.props.widget} />;
    return this.props.children;
  }
}

/** Dispatcher: resuelve `widget.type` contra `widgetRegistry` y renderiza, con fallback elegante para tipos desconocidos o fallas de render. */
export function WidgetRenderer({ widget }: { widget: Widget }) {
  const WidgetComponent = widgetRegistry[widget.type] ?? FallbackWidget;

  return (
    <WidgetErrorBoundary widget={widget}>
      <WidgetComponent widget={widget} />
    </WidgetErrorBoundary>
  );
}
