import { motion, useReducedMotion } from "motion/react";
import { FolderGit2, SquareArrowOutUpRight } from "lucide-react";
import type { Widget } from "@/types/agent-response";
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
  };
}

/** data: { items: [{ id, name, summary, stack, links: [{ label, url }] }] } */
export function ProjectsWidget({ widget }: { widget: Widget }) {
  const prefersReducedMotion = useReducedMotion();
  const items = asArray(widget.data.items).map(parseItem);
  if (items.length === 0) return null;

  return (
    <WidgetCard
      title={widget.title ?? "Projects"}
      icon={<FolderGit2 size={16} aria-hidden="true" />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="glass-panel rounded-xl p-4">
            <p className="font-label-md text-body-md font-semibold text-on-surface">{item.name}</p>
            {item.summary && (
              <p className="mt-1 text-body-md text-on-surface-variant">{item.summary}</p>
            )}
            {item.stack.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-label-sm text-primary"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
            {item.links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
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
        ))}
      </div>
    </WidgetCard>
  );
}
