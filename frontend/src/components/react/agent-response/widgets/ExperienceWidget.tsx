import { Briefcase } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { localizeExperienceFields } from "@/lib/experienceCopy";
import { TimelineRail, type TimelineRailItem } from "../TimelineRail";
import { WidgetCard } from "../WidgetCard";
import { useResponseLocale } from "../ResponseLocaleContext";
import { asArray, asRecord, asString, asStringArray } from "../utils";

interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  summary: string;
  highlights: string[];
  stack: string[];
  logoUrl?: string;
}

const EXPERIENCE_LOGOS: Record<string, string> = {
  "exp-finnegans-ai-developer": "/images/logos/logo_finnegans.jpg",
  "exp-freelance-fullstack": "/images/logos/logo-diego.png",
  "exp-cge-physics-teacher": "/images/logos/logo-cge.png",
};

function getExperienceLogo(id: string, company: string, role: string): string | undefined {
  const normCompany = company.toLowerCase();
  const normRole = role.toLowerCase();
  if (id === "exp-finnegans-ai-developer" || normCompany.includes("finnegans") || normRole.includes("ai developer") || normRole.includes("ia developer")) {
    return "/images/logos/logo_finnegans.jpg";
  }
  if (id === "exp-freelance-fullstack" || normCompany.includes("freelance") || normRole.includes("freelance") || normRole.includes("desarrollador web")) {
    return "/images/logos/logo-diego.png";
  }
  if (id === "exp-cge-physics-teacher" || normCompany.includes("cge") || normCompany.includes("consejo general") || normRole.includes("física") || normRole.includes("physics")) {
    return "/images/logos/logo-cge.png";
  }
  return EXPERIENCE_LOGOS[id];
}

function parseItem(raw: unknown, index: number): ExperienceItem {
  const item = asRecord(raw);
  const id = asString(item.id, `experience-${index}`);
  const company = asString(item.company);
  const role = asString(item.role);
  return {
    id,
    role,
    company,
    startDate: asString(item.startDate),
    endDate: asString(item.endDate),
    current: item.current === true,
    summary: asString(item.summary),
    highlights: asStringArray(item.highlights),
    stack: asStringArray(item.stack),
    logoUrl: getExperienceLogo(id, company, role),
  };
}

function formatDateRange(item: ExperienceItem, presentLabel: string) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
      <span className="text-[12px] text-on-surface-variant font-medium">
        {item.startDate} —
      </span>
      {item.current ? (
        <span className="rounded-full bg-secondary/10 border border-secondary/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
          {presentLabel}
        </span>
      ) : (
        <span className="text-[12px] text-on-surface-variant font-medium">
          {item.endDate}
        </span>
      )}
    </div>
  );
}

function ExperienceDetails({ item }: { item: ExperienceItem }) {
  return (
    <div className="space-y-3">
      {item.highlights.length > 0 && (
        <ul className="space-y-1.5">
          {item.highlights.map((highlight, i) => (
            <li key={i} className="flex gap-2 text-body-md text-on-surface-variant">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {highlight}
            </li>
          ))}
        </ul>
      )}
      {item.stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {item.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-label-sm text-on-surface"
            >
              {tech.replace(/^skill-/, "").replaceAll("-", " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function hasDetails(item: ExperienceItem) {
  return Boolean(item.highlights.length > 0 || item.stack.length > 0);
}

/** data: { items: [{ id, role, company, startDate, endDate, current, summary?, highlights, stack? }] } */
export function ExperienceWidget({ widget }: { widget: Widget }) {
  const locale = useResponseLocale();
  const presentLabel = locale === "en" ? "Present" : "Actualidad";
  const defaultTitle = locale === "en" ? "Experience" : "Experiencia";

  const items = asArray(widget.data.items)
    .map(parseItem)
    .map((item) => localizeExperienceFields(item, locale));
  if (items.length === 0) return null;

  const railItems: TimelineRailItem[] = items.map((item) => ({
    id: item.id,
    title: item.role,
    subtitle: item.company,
    description: item.summary || undefined,
    dateLabel: formatDateRange(item, presentLabel),
    logoUrl: item.logoUrl,
    details: hasDetails(item) ? <ExperienceDetails item={item} /> : undefined,
  }));

  return (
    <WidgetCard title={widget.title ?? defaultTitle} icon={<Briefcase size={14} aria-hidden="true" />}>
      <TimelineRail items={railItems} defaultOpenFirst orientation="auto" seed={widget.id} />
    </WidgetCard>
  );
}
