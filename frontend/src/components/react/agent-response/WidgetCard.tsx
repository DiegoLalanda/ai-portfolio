import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
  title?: string | null;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Contenedor visual compartido por todos los widgets: mismo "glass-card"
 * que el resto del sitio, con un título opcional + ícono. Cada widget solo
 * se ocupa de su contenido interno; este componente resuelve el chrome
 * repetido para que agregar un widget nuevo sea más simple.
 */
export function WidgetCard({ title, icon, className, children }: WidgetCardProps) {
  return (
    <div className={cn("glass-card p-5 md:p-6", className)}>
      {title && (
        <div className="mb-4 flex items-center gap-2 font-label-md text-label-md uppercase tracking-wide text-primary">
          {icon}
          <span>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}
