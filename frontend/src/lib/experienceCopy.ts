import type { Locale } from "@/i18n/types";

interface ExperienceCopy {
  role?: string;
  summary?: string;
  highlights?: string[];
}

const EXPERIENCE_EN: Record<string, ExperienceCopy> = {
  "exp-finnegans-ai-developer": {
    summary: "Research and development of AI agents and bots for internal use and products.",
    highlights: [
      "Research and development of AI agents and bots for internal processes and customer products.",
      "Internal improvements, system integrations, and AI-based features (LLMs, RAG, intelligent agents).",
      "Work with Angular, Python (FastAPI), and cloud services (AWS), with a focus on scalable, data-oriented systems.",
      "Prompt engineering, tokenization, embeddings, and model context protocols (MCP) applied to intelligent agents.",
      "Internal Python and AI tutor: one-on-one mentoring for developers from other teams and tutor in bootcamps on AI, agents, and architecture.",
    ],
  },
  "exp-freelance-fullstack": {
    role: "Full-Stack Web Developer",
    summary: "End-to-end full-stack platforms: UI/UX, frontend, backend, and deployment.",
    highlights: [
      "End-to-end development of full-stack platforms for different clients.",
      "UI/UX design, frontend, backend, database, and production deployment.",
      "Integration of external APIs (insurers, payment gateways, shipping) and digital marketing tools.",
    ],
  },
  "exp-cge-physics-teacher": {
    role: "Secondary School Physics Teacher",
    summary: "Physics teaching focused on planning, instructional communication, and research.",
    highlights: [
      "Strategic planning: designing annual study plans.",
      "Communication and teaching: breaking down abstract technical topics into clear explanations for different audiences.",
      "Research and synthesis: ongoing practice researching sources and analyzing information.",
      "Leadership and group management: guiding and motivating teams in a collaborative, goal-oriented environment.",
    ],
  },
};

export function localizeExperienceFields<
  T extends {
    id: string;
    role: string;
    summary: string;
    highlights: string[];
  },
>(item: T, locale: Locale): T {
  if (locale !== "en") return item;
  const copy = EXPERIENCE_EN[item.id];
  if (!copy) return item;
  return {
    ...item,
    role: copy.role ?? item.role,
    summary: copy.summary ?? item.summary,
    highlights: copy.highlights ?? item.highlights,
  } as T;
}
