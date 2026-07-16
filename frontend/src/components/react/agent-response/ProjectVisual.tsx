import { Database, Layers, Workflow } from "lucide-react";
import { asArray, asRecord, asString } from "./utils";

export interface ProjectMedia {
  type: string;
  url: string;
  alt: string;
}

const FALLBACK_ICONS = [Workflow, Layers, Database] as const;

export function parseProjectMedia(raw: unknown): ProjectMedia | null {
  const items = asArray(raw);
  for (const entry of items) {
    const media = asRecord(entry);
    const url = asString(media.url);
    if (!url) continue;
    return {
      type: asString(media.type, "image"),
      url,
      alt: asString(media.alt, "Project preview"),
    };
  }
  return null;
}

export function parseAllProjectMedia(raw: unknown): ProjectMedia[] {
  const items = asArray(raw);
  const result: ProjectMedia[] = [];
  for (const entry of items) {
    const media = asRecord(entry);
    const url = asString(media.url);
    if (!url) continue;
    result.push({
      type: asString(media.type, "image"),
      url,
      alt: asString(media.alt, "Project preview"),
    });
  }
  return result;
}

interface ProjectVisualProps {
  media?: ProjectMedia | null;
  name: string;
  variant?: "split" | "card" | "compact";
}

export function ProjectVisual({ media, name, variant = "split" }: ProjectVisualProps) {
  if (media?.url) {
    return (
      <div className={cnVisualPanel(variant)}>
        <img
          src={media.url}
          alt={media.alt || name}
          loading="lazy"
          decoding="async"
          className={
            variant === "split"
              ? "absolute inset-0 h-full w-full object-contain"
              : "absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          }
        />
        {variant !== "split" && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-[#050505]/20 to-transparent" />
        )}
        {variant === "card" && (
          <div className="absolute bottom-0 left-0 w-full p-4">
            <p className="font-label-sm uppercase tracking-wide text-on-surface-variant">{name}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cnVisualPanel(variant)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent opacity-20 transition-transform duration-1000 group-hover:scale-110" />
      <div className="relative z-10 grid grid-cols-3 gap-1.5">
        {FALLBACK_ICONS.map((Icon, index) => (
          <div
            key={index}
            className={`flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary ${
              variant === "compact" ? "h-8 w-8" : "h-14 w-14 md:h-16 md:w-16"
            }`}
          >
            <Icon size={variant === "compact" ? 14 : 22} aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}

function cnVisualPanel(variant: "split" | "card" | "compact") {
  if (variant === "split") {
    return "project-visual relative aspect-video w-full overflow-hidden bg-transparent";
  }
  if (variant === "compact") {
    return "project-visual relative aspect-video w-full overflow-hidden bg-transparent";
  }
  return "project-visual relative flex aspect-video w-full items-center justify-center overflow-hidden bg-transparent p-6";
}
