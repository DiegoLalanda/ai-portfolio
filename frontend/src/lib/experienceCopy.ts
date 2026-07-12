import type { Locale } from "@/i18n/types";

interface ExperienceCopy {
  role?: string;
  summary?: string;
  highlights?: string[];
}

const EXPERIENCE_EN: Record<string, ExperienceCopy> = {
  "exp-finnegans-ai-developer": {
    summary:
      "Member of the Artificial Intelligence team: research and development of AI agents and bots for internal use and customer-facing products.",
    highlights: [
      "Research and development of AI agents and bots for internal processes and customer products.",
      "Internal improvements, system integrations, and AI-based features (LLMs, RAG, intelligent agents).",
      "Work with Angular, Python (FastAPI), and cloud services (AWS), with a focus on scalable, data-oriented systems.",
      "Prompt engineering, tokenization, embeddings, and model context protocols (MCP) applied to intelligent agents.",
    ],
  },
  "exp-freelance-fullstack": {
    role: "Full-Stack Web Developer",
    summary:
      "End-to-end development of full-stack platforms for different clients: UI/UX design, frontend, backend, database, and deployment.",
    highlights: [
      "End-to-end development of full-stack platforms for different clients.",
      "UI/UX design, frontend, backend, database, and production deployment.",
      "Integration of external APIs (insurers, payment gateways, shipping) and digital marketing tools.",
    ],
  },
  "exp-cge-physics-teacher": {
    role: "Secondary School Physics Teacher",
    summary:
      "Secondary-level Physics teaching focused on strategic planning, instructional communication, and research.",
    highlights: [
      "Strategic planning: designing annual study plans.",
      "Communication and teaching: breaking down abstract technical topics into clear explanations for different audiences.",
      "Research and synthesis: ongoing practice researching sources and analyzing information.",
      "Leadership and group management: guiding and motivating teams in a collaborative, goal-oriented environment.",
    ],
  },
};

export function localizeExperienceFields(
  item: {
    id: string;
    role: string;
    summary: string;
    highlights: string[];
  },
  locale: Locale,
) {
  if (locale !== "en") return item;
  const copy = EXPERIENCE_EN[item.id];
  if (!copy) return item;
  return {
    ...item,
    role: copy.role ?? item.role,
    summary: copy.summary ?? item.summary,
    highlights: copy.highlights ?? item.highlights,
  };
}
