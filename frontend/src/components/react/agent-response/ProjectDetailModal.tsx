import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ExternalLink,
  Lightbulb,
  Rocket,
  Sparkles,
  X,
} from "lucide-react";
import type { PortfolioProject } from "@/lib/projectCatalog";
import { formatStackLabel } from "@/lib/projectCatalog";
import { ProjectVisual, parseAllProjectMedia } from "./ProjectVisual";

interface ProjectDetailModalProps {
  project: PortfolioProject | null;
  labels: {
    close: string;
    returnToPortfolio: string;
    challenge: string;
    solution: string;
    results: string;
    highlights: string;
    role: string;
    team: string;
  };
  onClose: () => void;
}

export function ProjectDetailModal({ project, labels, onClose }: ProjectDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!project) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [project]);

  useEffect(() => {
    if (!project) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [project, onClose]);

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [project]);

  if (!project || typeof document === "undefined") return null;

  const allMedia = parseAllProjectMedia(project.media);
  const media = allMedia[activeMediaIndex] || null;

  return createPortal(
    <div
      id="project-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-label={project.name}
      aria-hidden="false"
      className="modal-open fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background/90 opacity-100 backdrop-blur-xl"
    >
      <div className="sticky top-0 z-10 flex justify-end px-margin-edge py-6">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="secondary-btn flex h-11 w-11 items-center justify-center rounded-full text-on-surface"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <main className="mx-auto w-full max-w-container-max px-margin-edge pb-section-gap-desktop pt-0">
        <section className="fade-in-up mb-section-gap-desktop flex flex-col items-center text-center">
          {project.stack.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-label-sm text-[10px] uppercase tracking-wider text-primary"
                >
                  {formatStackLabel(tech)}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-display-xl text-display-xl mb-4 max-w-4xl text-white">{project.name}</h1>
          <p className="font-label-md mb-3 text-primary">{labels.role}: {project.role}</p>
          <p className="font-body-lg text-body-lg mb-8 max-w-2xl text-on-surface-variant">
            {project.description || project.summary}
          </p>
          {project.links.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4">
              {project.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-btn inline-flex items-center gap-2 rounded-xl px-8 py-4 font-label-md text-white"
                >
                  {link.label}
                  <ExternalLink size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="fade-in-up mb-section-gap-desktop overflow-hidden rounded-3xl border border-white/10">
          <ProjectVisual media={media} name={project.name} variant="split" />
          {allMedia.length > 1 && (
            <div className="flex gap-2 overflow-x-auto bg-surface-container-highest/50 p-4 border-t border-white/10 scrollbar-thin">
              {allMedia.map((m, index) => (
                <button
                  key={index}
                  onClick={() => setActiveMediaIndex(index)}
                  className={`relative aspect-video h-14 shrink-0 overflow-hidden rounded-lg border-2 bg-transparent transition-all duration-300 ${
                    activeMediaIndex === index ? "border-primary scale-95 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={m.url} alt={m.alt} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="fade-in-up mb-section-gap-desktop grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="glass-card flex flex-col justify-between p-8 md:col-span-7 md:p-10">
            <div>
              <div className="mb-4 flex items-center gap-2 text-secondary">
                <Sparkles size={18} aria-hidden="true" />
                <span className="font-label-md">{labels.challenge}</span>
              </div>
              <p className="font-headline-md text-headline-md leading-snug text-white">{project.problem}</p>
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-primary/10 to-transparent p-8 md:col-span-5 md:p-10">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Rocket size={18} aria-hidden="true" />
              <span className="font-label-md">{labels.results}</span>
            </div>
            <p className="font-body-md text-on-surface-variant">{project.result}</p>
          </div>

          <div className="glass-card p-8 md:col-span-12 md:p-10">
            <div className="mb-4 flex items-center gap-2 text-tertiary">
              <Lightbulb size={18} aria-hidden="true" />
              <span className="font-label-md">{labels.solution}</span>
            </div>
            <p className="font-body-md text-on-surface-variant">{project.solution}</p>
          </div>
        </section>

        {project.highlights.length > 0 && (
          <section className="fade-in-up mb-section-gap-desktop">
            <h2 className="font-headline-lg text-headline-lg mb-6 text-white">{labels.highlights}</h2>
            <ul className="glass-card grid gap-4 p-6 md:grid-cols-2 md:p-8">
              {project.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3 text-body-md text-on-surface-variant">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {project.team.length > 0 && (
          <section className="fade-in-up mb-section-gap-desktop">
            <h2 className="font-headline-lg text-headline-lg mb-6 text-white">{labels.team}</h2>
            <ul className="glass-card space-y-3 p-6 md:p-8">
              {project.team.map((member) => (
                <li
                  key={`${member.name}-${member.role}`}
                  className="flex flex-col gap-0.5 border-b border-white/5 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  {member.url ? (
                    <a
                      href={member.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-label-md text-primary hover:underline"
                    >
                      {member.name}
                    </a>
                  ) : (
                    <span className="font-label-md text-on-surface">{member.name}</span>
                  )}
                  <span className="text-body-md text-on-surface-variant">{member.role}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="fade-in-up flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-10 py-4 font-label-md text-primary shadow-[0_0_15px_rgba(208,188,255,0.1)] transition-all duration-300 hover:bg-primary hover:text-on-primary"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            {labels.returnToPortfolio}
          </button>
        </section>
      </main>
    </div>,
    document.body,
  );
}
