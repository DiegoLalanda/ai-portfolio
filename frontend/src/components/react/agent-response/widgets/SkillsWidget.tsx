import { Layers } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { SkillBadge } from "../SkillBadge";
import { getCategoryMeta } from "../skillIcons";
import { WidgetCard } from "../WidgetCard";
import { useResponseLocale } from "../ResponseLocaleContext";
import { asRecord, asStringArray } from "../utils";

/** data: { categories: { [category: string]: string[] } } */
export function SkillsWidget({ widget }: { widget: Widget }) {
  const locale = useResponseLocale();
  const categories = asRecord(widget.data.categories);
  const entries = Object.entries(categories)
    .map(([category, skills]) => [category, asStringArray(skills)] as const)
    .filter(([, skills]) => skills.length > 0);

  if (entries.length === 0) return null;

  return (
    <WidgetCard
      title={widget.title ?? (locale === "en" ? "Skills" : "Habilidades")}
      icon={<Layers size={14} aria-hidden="true" />}
    >
      <div className="skills-board flex flex-col gap-7 md:gap-8">
        {entries.map(([category, skills]) => {
          const meta = getCategoryMeta(category);

          return (
            <section key={category} className="skills-board__row min-w-0">
              <div className="mb-4 flex items-center gap-2.5">
                <span className={`h-1.5 w-1.5 rounded-full ${meta.accentDot}`} aria-hidden="true" />
                <h3
                  className={`font-label-md text-label-md uppercase tracking-[0.14em] ${meta.accentClass}`}
                >
                  {meta.label}
                </h3>
                <span className="h-px flex-1 bg-white/5" aria-hidden="true" />
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
                {skills.map((skill) => (
                  <SkillBadge key={skill} name={skill} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </WidgetCard>
  );
}
