import projectsData from "../../../backend/app/data/projects.json";
import type { Locale } from "@/i18n/types";
import { localizeProject } from "@/lib/projectCopy";

export type ProjectDisplayGroup = "full-stack" | "ia" | "otras";

export interface ProjectLink {
  label: string;
  url: string;
  type?: string;
}

export interface ProjectMedia {
  type: string;
  url: string;
  alt?: string;
}

export interface ProjectTeamMember {
  name: string;
  role: string;
  url?: string | null;
}

export interface PortfolioProject {
  id: string;
  name: string;
  type: string;
  role: string;
  summary: string;
  description: string;
  problem: string;
  solution: string;
  result: string;
  highlights: string[];
  stack: string[];
  team: ProjectTeamMember[];
  links: ProjectLink[];
  media: ProjectMedia[];
  displayGroup: ProjectDisplayGroup;
  featured: boolean;
  order: number;
  visible: boolean;
}

const GROUP_ORDER: ProjectDisplayGroup[] = ["full-stack", "ia", "otras"];

const GROUP_LABELS: Record<Locale, Record<ProjectDisplayGroup, string>> = {
  es: {
    "full-stack": "Full Stack",
    ia: "IA",
    otras: "Otras",
  },
  en: {
    "full-stack": "Full Stack",
    ia: "AI",
    otras: "Other",
  },
};

export const PORTFOLIO_PROJECTS = (projectsData as PortfolioProject[])
  .filter((project) => project.visible)
  .sort((a, b) => a.order - b.order);

export function getProjectById(id: string, locale: Locale = "es"): PortfolioProject | undefined {
  const project = PORTFOLIO_PROJECTS.find((item) => item.id === id);
  return project ? localizeProject(project, locale) : undefined;
}

export function getPortfolioSections(locale: Locale, groups?: ProjectDisplayGroup[]) {
  const labels = GROUP_LABELS[locale] ?? GROUP_LABELS.es;
  const order = groups?.length ? groups.filter((g) => GROUP_ORDER.includes(g)) : GROUP_ORDER;

  return order
    .map((group) => ({
      id: group,
      title: labels[group],
      items: PORTFOLIO_PROJECTS.filter((project) => project.displayGroup === group).map((project) =>
        localizeProject(project, locale),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

const VALID_DISPLAY_GROUPS = new Set<ProjectDisplayGroup>(GROUP_ORDER);

export function parseProjectDisplayGroups(data: Record<string, unknown>): ProjectDisplayGroup[] | undefined {
  const single = data.displayGroup;
  if (typeof single === "string" && VALID_DISPLAY_GROUPS.has(single as ProjectDisplayGroup)) {
    return [single as ProjectDisplayGroup];
  }

  const multiple = data.displayGroups;
  if (Array.isArray(multiple)) {
    const filtered = multiple.filter(
      (group): group is ProjectDisplayGroup =>
        typeof group === "string" && VALID_DISPLAY_GROUPS.has(group as ProjectDisplayGroup),
    );
    if (filtered.length > 0) return filtered;
  }

  return undefined;
}

/** Respaldo cuando el modelo olvida `displayGroup` pero el título del widget ya acota el tema. */
export function inferProjectDisplayGroupsFromTitle(title?: string | null): ProjectDisplayGroup[] | undefined {
  if (!title) return undefined;
  const normalized = title.toLowerCase();

  if (/\bproyectos?\s+(de\s+)?(ia|ai)\b/.test(normalized) || /\b(ia|ai)\s+projects?\b/.test(normalized)) {
    return ["ia"];
  }
  if (/\bfull[-\s]?stack\b/.test(normalized) && /\bproyectos?\b|\bprojects?\b/.test(normalized)) {
    return ["full-stack"];
  }
  if (/\botras\b|\bother\b/.test(normalized) && /\bproyectos?\b|\bprojects?\b/.test(normalized)) {
    return ["otras"];
  }

  return undefined;
}

export function formatStackLabel(stackId: string) {
  return stackId.replace(/^skill-/, "").replaceAll("-", " ");
}
