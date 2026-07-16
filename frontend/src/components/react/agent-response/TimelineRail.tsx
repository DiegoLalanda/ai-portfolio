import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const DOT_COLORS = ["bg-primary", "bg-secondary", "bg-tertiary"] as const;

export type TimelineOrientation = "vertical" | "horizontal" | "auto";

export interface TimelineRailItem {
  id: string;
  title: string;
  subtitle?: string;
  /** Descripción breve visible en la tarjeta (sin expandir). */
  description?: string;
  dateLabel: ReactNode;
  logoUrl?: string;
  /** Contenido que se revela al expandir. Si está vacío, el nodo no es interactivo. */
  details?: ReactNode;
}

interface TimelineRailProps {
  items: TimelineRailItem[];
  /** Si true, el primer item con detalle arranca expandido. */
  defaultOpenFirst?: boolean;
  /**
   * Orientación del rail. `auto` elige vertical/horizontal de forma estable
   * según `seed` (no cambia en cada re-render).
   */
  orientation?: TimelineOrientation;
  /** Semilla para la elección automática (p. ej. widget.id). */
  seed?: string;
}

function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function resolveOrientation(
  orientation: TimelineOrientation,
  seed: string,
  itemCount: number,
): "vertical" | "horizontal" {
  if (orientation === "vertical" || orientation === "horizontal") return orientation;
  // 1 ítem o muchos: vertical queda más legible.
  if (itemCount <= 1 || itemCount > 4) return "vertical";
  return hashSeed(seed) % 2 === 0 ? "horizontal" : "vertical";
}

/**
 * Línea temporal estilo prototipo (vertical u horizontal).
 * Click / Enter / Space expanden el detalle inline.
 */
export function TimelineRail({
  items,
  defaultOpenFirst = false,
  orientation = "auto",
  seed = "",
}: TimelineRailProps) {
  const baseId = useId();
  const prefersReducedMotion = useReducedMotion();
  const layoutSeed = seed || items.map((item) => item.id).join("|");
  const layout = useMemo(
    () => resolveOrientation(orientation, layoutSeed, items.length),
    [orientation, layoutSeed, items.length],
  );

  const firstExpandable = defaultOpenFirst ? items.find((item) => Boolean(item.details))?.id ?? null : null;
  const [openId, setOpenId] = useState<string | null>(firstExpandable);

  function toggle(id: string, expandable: boolean) {
    if (!expandable) return;
    setOpenId((current) => (current === id ? null : id));
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: string, expandable: boolean) {
    if (!expandable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle(id, expandable);
    }
  }

  if (layout === "horizontal") {
    return (
      <ol
        className="timeline-rail timeline-rail--horizontal relative m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))] md:gap-8"
        data-orientation="horizontal"
      >
        <span className="timeline-rail__line timeline-rail__line--horizontal" aria-hidden="true" />

        {items.map((item, index) => {
          const expandable = Boolean(item.details);
          const isOpen = openId === item.id;
          const panelId = `${baseId}-panel-${item.id}`;
          const buttonId = `${baseId}-btn-${item.id}`;

          return (
            <li key={item.id} className="timeline-rail__item relative z-10 flex flex-col gap-3 pt-1">
              <span
                className={cn(
                  "timeline-rail__dot relative z-10 mb-1 hidden h-3.5 w-3.5 rounded-full border-[3px] border-background md:block",
                  DOT_COLORS[index % DOT_COLORS.length],
                  isOpen && "timeline-rail__dot--active",
                )}
                aria-hidden="true"
              />

              <TimelineNode
                item={item}
                expandable={expandable}
                isOpen={isOpen}
                panelId={panelId}
                buttonId={buttonId}
                prefersReducedMotion={Boolean(prefersReducedMotion)}
                headerLayout="stacked"
                onToggle={() => toggle(item.id, expandable)}
                onKeyDown={(event) => onKeyDown(event, item.id, expandable)}
              />
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="timeline-rail timeline-rail--vertical relative m-0 flex list-none flex-col gap-4 p-0 md:gap-5" data-orientation="vertical">
      <span className="timeline-rail__line timeline-rail__line--vertical" aria-hidden="true" />

      {items.map((item, index) => {
        const expandable = Boolean(item.details);
        const isOpen = openId === item.id;
        const panelId = `${baseId}-panel-${item.id}`;
        const buttonId = `${baseId}-btn-${item.id}`;

        return (
          <li key={item.id} className="timeline-rail__item relative pl-8 md:pl-10">
            <span
              className={cn(
                "timeline-rail__dot absolute left-0 top-5 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px] border-background md:top-6",
                DOT_COLORS[index % DOT_COLORS.length],
                isOpen && "timeline-rail__dot--active",
              )}
              aria-hidden="true"
            />

            <TimelineNode
              item={item}
              expandable={expandable}
              isOpen={isOpen}
              panelId={panelId}
              buttonId={buttonId}
              prefersReducedMotion={Boolean(prefersReducedMotion)}
              headerLayout="inline"
              onToggle={() => toggle(item.id, expandable)}
              onKeyDown={(event) => onKeyDown(event, item.id, expandable)}
            />
          </li>
        );
      })}
    </ol>
  );
}

interface TimelineNodeProps {
  item: TimelineRailItem;
  expandable: boolean;
  isOpen: boolean;
  panelId: string;
  buttonId: string;
  prefersReducedMotion: boolean;
  headerLayout: "inline" | "stacked";
  onToggle: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

function TimelineNode({
  item,
  expandable,
  isOpen,
  panelId,
  buttonId,
  prefersReducedMotion,
  headerLayout,
  onToggle,
  onKeyDown,
}: TimelineNodeProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-white/5 bg-white/5 transition-colors",
        expandable && "interactive-card",
        isOpen && "border-primary/25 bg-primary/5",
      )}
    >
      {expandable ? (
        <button
          id={buttonId}
          type="button"
          className="flex w-full items-start justify-between gap-3 p-4 text-left md:p-5"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          onKeyDown={onKeyDown}
        >
          <TimelineRailHeader item={item} layout={headerLayout} />
          <ChevronDown
            size={16}
            className={cn(
              "mt-0.5 shrink-0 text-primary transition-transform duration-300",
              isOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="flex w-full items-start justify-between gap-3 p-4 md:p-5">
          <TimelineRailHeader item={item} layout={headerLayout} />
        </div>
      )}

      <AnimatePresence initial={false}>
        {expandable && isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-4 pb-4 pt-3 md:px-5 md:pb-5">{item.details}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimelineRailHeader({
  item,
  layout,
}: {
  item: TimelineRailItem;
  layout: "inline" | "stacked";
}) {
  const logo = item.logoUrl ? (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-sm flex items-center justify-center">
      <img src={item.logoUrl} alt={item.subtitle || item.title} className="h-full w-full object-cover" />
    </div>
  ) : null;

  if (layout === "stacked") {
    return (
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {logo}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="font-label-sm text-on-surface-variant">{item.dateLabel}</div>
          <h3 className="font-headline-md text-on-surface">{item.title}</h3>
          {item.subtitle && <p className="font-body-md text-primary">{item.subtitle}</p>}
          {item.description && (
            <p className="text-[13px] leading-relaxed text-on-surface-variant">
              {item.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {logo}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="font-label-md text-body-md font-semibold text-on-surface">
            {item.title}
            {item.subtitle ? (
              <>
                {" "}
                <span className="text-on-surface-variant">·</span>{" "}
                <span className="text-primary">{item.subtitle}</span>
              </>
            ) : null}
          </p>
          <div className="font-label-sm text-on-surface-variant">{item.dateLabel}</div>
        </div>
        {item.description && (
          <p className="text-[13px] leading-relaxed text-on-surface-variant">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
