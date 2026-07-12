import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, FolderGit2 } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { getTranslations } from "@/i18n";
import {
  getPortfolioSections,
  getProjectById,
  inferProjectDisplayGroupsFromTitle,
  parseProjectDisplayGroups,
  type PortfolioProject,
} from "@/lib/projectCatalog";
import { ProjectVisual, parseProjectMedia } from "../ProjectVisual";
import { ProjectDetailModal } from "../ProjectDetailModal";
import { WidgetCard } from "../WidgetCard";
import { useResponseLocale } from "../ResponseLocaleContext";

function ProjectCard({
  project,
  viewDetailsLabel,
  onViewDetails,
}: {
  project: PortfolioProject;
  viewDetailsLabel: string;
  onViewDetails: (project: PortfolioProject) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const media = project.media[0] ? parseProjectMedia(project.media) : null;

  return (
    <article className="interactive-card group flex w-[11.5rem] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-white/5 sm:w-[12.5rem]">
      <ProjectVisual media={media} name={project.name} variant="compact" />
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 font-label-sm text-[13px] font-semibold leading-snug text-on-surface">
          {project.name}
        </h3>
        {project.summary && (
          <p className="mt-1.5 line-clamp-2 flex-1 text-[12px] leading-snug text-on-surface-variant">
            {project.summary}
          </p>
        )}
        <motion.button
          type="button"
          whileHover={prefersReducedMotion ? undefined : { x: 2 }}
          onClick={() => onViewDetails(project)}
          className="mt-2.5 inline-flex w-fit items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 font-label-sm text-[11px] text-primary transition-colors hover:bg-primary/20"
        >
          {viewDetailsLabel}
          <ArrowRight size={12} aria-hidden="true" />
        </motion.button>
      </div>
    </article>
  );
}

/** Cada categoría es una fila horizontal; las filas se apilan verticalmente. */
export function ProjectsWidget({ widget }: { widget: Widget }) {
  const locale = useResponseLocale();
  const t = getTranslations(locale);
  const displayGroups =
    parseProjectDisplayGroups(widget.data) ?? inferProjectDisplayGroupsFromTitle(widget.title);
  const sections = useMemo(
    () => getPortfolioSections(locale, displayGroups),
    [locale, displayGroups],
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = selectedProjectId
    ? (getProjectById(selectedProjectId, locale) ?? null)
    : null;

  if (sections.every((section) => section.items.length === 0)) return null;

  return (
    <>
      <WidgetCard
        title={widget.title ?? t.projects.title}
        icon={<FolderGit2 size={14} aria-hidden="true" />}
        flush
        contentClassName="p-0"
      >
        <div className="projects-board flex flex-col gap-6 px-6 pb-6 md:gap-7 md:px-8 md:pb-8">
          {sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`projects-section-${section.id}`}
              className="projects-board__row min-w-0"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <h3
                  id={`projects-section-${section.id}`}
                  className="shrink-0 font-label-md text-label-md uppercase tracking-[0.14em] text-primary"
                >
                  {section.title}
                </h3>
                <span className="h-px min-w-8 flex-1 bg-white/5" aria-hidden="true" />
              </div>

              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 snap-x snap-mandatory">
                {section.items.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewDetailsLabel={t.projects.viewDetails}
                    onViewDetails={(item) => setSelectedProjectId(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </WidgetCard>

      <ProjectDetailModal
        project={selectedProject}
        labels={t.projects.modal}
        onClose={() => setSelectedProjectId(null)}
      />
    </>
  );
}
