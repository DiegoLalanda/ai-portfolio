import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
  title?: string | null;
  icon?: ReactNode;
  className?: string;
  contentClassName?: string;
  /** When true, children handle their own padding (e.g. split project card). */
  flush?: boolean;
  children: ReactNode;
}

/**
 * Contenedor visual compartido por todos los widgets: bloque glass-panel
 * al estilo del dashboard prototipo, con section-label opcional.
 *
 * El padding va en un wrapper — nunca en `.section-label` (es un pill inline-flex).
 */
export function WidgetCard({
  title,
  icon,
  className,
  contentClassName,
  flush = false,
  children,
}: WidgetCardProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl glass-panel", className)}>
      {title && (
        <div
          className={cn(
            "px-6 pt-5 md:px-8 md:pt-6",
            flush && "mb-4 md:mb-5",
          )}
        >
          <div className="section-label">
            {icon}
            <span>{title}</span>
          </div>
        </div>
      )}
      <div
        className={cn(
          !flush && "px-6 pb-6 pt-4 md:px-8 md:pb-8 md:pt-5",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
