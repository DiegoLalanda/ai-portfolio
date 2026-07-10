import { motion, useReducedMotion } from "motion/react";
import { FolderGit2, SquareArrowOutUpRight } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { ProjectVisual, parseProjectMedia, type ProjectMedia } from "../ProjectVisual";
import { WidgetCard } from "../WidgetCard";
import { asArray, asRecord, asString, asStringArray } from "../utils";

interface ProjectLink {
  label: string;
  url: string;
}

interface ProjectItem {
  id: string;
  name: string;
  summary: string;
  stack: string[];
  links: ProjectLink[];
  media: ProjectMedia | null;
}

function parseLink(raw: unknown): ProjectLink | null {
  const link = asRecord(raw);
  const url = asString(link.url);
  if (!url) return null;
  return { label: asString(link.label, "Link"), url };
}

function parseItem(raw: unknown, index: number): ProjectItem {
  const item = asRecord(raw);
  return {
    id: asString(item.id, `project-${index}`),
    name: asString(item.name),
    summary: asString(item.summary),
    stack: asStringArray(item.stack),
    links: asArray(item.links)
      .map(parseLink)
      .filter((link): link is ProjectLink => link !== null),
    media: parseProjectMedia(item.media),
  };
}

function ProjectCaseStudy({ item, hideHeader = false }: { item: ProjectItem; hideHeader?: boolean }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <article className="group overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10">
          {!hideHeader && (
            <div className="section-label mb-4">
              <FolderGit2 size={14} aria-hidden="true" />
              Case Study
            </div>
          )}
          <h3 className="font-display-lg text-headline-md mb-3 text-primary md:text-headline-lg">{item.name}</h3>
          {item.summary && (
            <p className="font-body-md mb-6 text-on-surface-variant md:font-body-lg">{item.summary}</p>
          )}
          {item.stack.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-1.5">
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
          {item.links.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {item.links.map((link) => (
                <motion.a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2.5 font-label-md text-primary transition-colors hover:bg-primary/20"
                >
                  {link.label}
                  <SquareArrowOutUpRight size={14} aria-hidden="true" />
                </motion.a>
              ))}
            </div>
          )}
        </div>
        <ProjectVisual media={item.media} name={item.name} variant="split" />
      </div>
    </article>
  );
}

function ProjectCard({ item }: { item: ProjectItem }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <article className="interactive-card group overflow-hidden rounded-xl border border-white/5">
      <ProjectVisual media={item.media} name={item.name} variant="card" />
      <div className="p-5 md:p-6">
        <h3 className="font-label-md text-body-md font-semibold text-on-surface">{item.name}</h3>
        {item.summary && <p className="mt-2 text-body-md text-on-surface-variant">{item.summary}</p>}
        {item.links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {item.links.map((link) => (
              <motion.a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                className="inline-flex items-center gap-1 text-label-sm text-secondary hover:underline"
              >
                {link.label}
                <SquareArrowOutUpRight size={12} aria-hidden="true" />
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/** data: { items: [{ id, name, summary, stack, links, media? }] } */
export function ProjectsWidget({ widget }: { widget: Widget }) {
  const items = asArray(widget.data.items).map(parseItem);
  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <WidgetCard
        title={widget.title ?? "Projects"}
        icon={<FolderGit2 size={14} aria-hidden="true" />}
        flush
        contentClassName="p-0"
        className="interactive-card"
      >
        <ProjectCaseStudy item={items[0]} hideHeader />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title={widget.title ?? "Projects"}
      icon={<FolderGit2 size={14} aria-hidden="true" />}
      flush
      contentClassName="p-0"
    >
      <div className="grid gap-gutter px-6 pb-6 md:grid-cols-2 md:px-8 md:pb-8">
        {items.map((item) => (
          <ProjectCard key={item.id} item={item} />
        ))}
      </div>
    </WidgetCard>
  );
}
