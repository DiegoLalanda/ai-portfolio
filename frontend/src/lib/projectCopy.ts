import type { Locale } from "@/i18n/types";
import type { PortfolioProject } from "@/lib/projectCatalog";

type ProjectTextFields = Pick<
  PortfolioProject,
  "name" | "summary" | "description" | "problem" | "solution" | "result" | "highlights"
> & {
  linkLabels?: Record<string, string>;
  mediaAlts?: string[];
};

/** Copy en inglés para el board/modal de proyectos (el JSON fuente está en español). */
const PROJECT_EN: Record<string, ProjectTextFields> = {
  "proj-finni": {
    name: "Finni — AI agent orchestrator (Finnegans)",
    summary:
      "AI agent orchestrator for internal workflows and customer-facing products.",
    description:
      "Conversational agent orchestrator with LLMs, RAG, tools, and sub-agents, integrated into the GO ecosystem. I contribute as an AI Developer on the AI team.",
    problem:
      "A reusable, multi-model agent platform was needed, contextualized by customer domain and integrated into the ERP.",
    solution:
      "Backend with FastAPI + Strands Agents, Amazon Bedrock, Knowledge Bases (RAG), DynamoDB, Redis, SSE streaming, and Angular chat/admin panels.",
    result:
      "An evolving platform that centralizes AI agents for internal use and customer-oriented features.",
    highlights: [
      "Agent orchestration (Strands) with tools, sub-agents, RAG, and SSE streaming.",
      "Stack: Python/FastAPI, Angular, AWS Bedrock, DynamoDB, Redis, S3, MCP, and Langfuse.",
      "Chat, bot administration, and Knowledge Bases in the GO ecosystem.",
    ],
    linkLabels: { Finnegans: "Finnegans" },
    mediaAlts: [
      "Screenshot of the Finni UI",
      "Finni screenshot — chat experience",
      "Finni screenshot — agent flow",
      "Finni screenshot — assistant response",
      "Finni screenshot — tools and orchestration",
      "Finni screenshot — product interface",
    ],
  },
  "proj-ai-portfolio": {
    name: "AI Portfolio — Conversational assistant",
    summary:
      "Interactive portfolio with an AI assistant that streams answers about experience, skills, and projects.",
    description:
      "This portfolio: Astro + React frontend with dynamic widgets (skills, projects, experience) and a FastAPI + Gemini backend with function calling, structured responses, and real-time SSE streaming.",
    problem:
      "A static CV does not let recruiters explore the profile conversationally or see Diego's AI experience interactively.",
    solution:
      "An agent with tools over portfolio JSON data, an AgentResponse contract with visual widgets, streaming chat, and a bilingual glassmorphism UI (ES/EN).",
    result:
      "A living portfolio where visitors ask in natural language and get grounded answers with visual blocks (skills, projects, timelines).",
    highlights: [
      "Streaming chat with Gemini, manual function calling, and progress events.",
      "Dynamic widgets: skills, grouped projects, experience/education timelines.",
      "Stack: Astro, React, TypeScript, Tailwind, FastAPI, Python, and Gemini.",
    ],
    mediaAlts: [
      "AI Portfolio screenshot — main screen",
      "AI Portfolio screenshot — conversational experience",
      "AI Portfolio screenshot — response widgets",
      "AI Portfolio screenshot — project detail",
      "AI Portfolio screenshot — assistant interface",
    ],
  },
  "proj-en-un-toke": {
    name: "En un Toke",
    summary: "E-commerce with WordPress, WooCommerce, Mercado Pago, and ad optimization.",
    description:
      "E-commerce built with WordPress and WooCommerce, integrating Mercado Pago payments and Correo Argentino shipping, plus Meta Pixel and Conversions API for campaign optimization.",
    problem:
      "A business needed an online store with payments, shipping, and conversion tracking for digital marketing campaigns.",
    solution:
      "WooCommerce setup with Mercado Pago, Correo Argentino, Meta Pixel, and Conversions API.",
    result: "A live e-commerce store with payments, shipping, and ad campaign optimization.",
    highlights: [
      "Mercado Pago and Correo Argentino integrations.",
      "Meta Pixel and Conversions API for campaign optimization.",
      "WordPress + WooCommerce with a digital marketing focus.",
    ],
    linkLabels: { "Sitio web": "Website" },
    mediaAlts: ["Mountains and valley at sunrise"],
  },
  "proj-tu-seguro-online": {
    name: "Tu Seguro Online",
    summary: "Full-stack client management platform for an insurance advisor.",
    description:
      "Full-stack client management platform for an insurance advisor, with external insurer APIs (Río Uruguay Seguros) for vehicle quotes.",
    problem:
      "An insurance advisor needed to centralize client management and integrate external insurer quotes.",
    solution:
      "NestJS + Angular platform with Río Uruguay Seguros API integrations, deployed on Render and Neon.",
    result: "Client management system with vehicle quoting integrated to insurer APIs.",
    highlights: [
      "Integrations with external insurer APIs (Río Uruguay Seguros).",
      "Client management and vehicle quoting.",
      "Stack: NestJS, Angular, PostgreSQL, TypeORM, Render, and Neon.",
    ],
    linkLabels: { Repositorio: "Repository" },
    mediaAlts: ["Car in studio for insurance quoting"],
  },
  "proj-easy-survey": {
    name: "Easy Survey",
    summary: "Anonymous survey platform with UI/UX design and full deployment.",
    description:
      "Anonymous survey platform. Responsible for UI/UX design (Figma), Angular frontend, and full deployment.",
    problem:
      "Need for a simple platform to create and answer anonymous surveys with a clear user experience.",
    solution:
      "Full-stack build with NestJS and Angular, PostgreSQL database, deployed on Render and Neon.",
    result: "Production-ready platform with a complete anonymous survey flow.",
    highlights: [
      "End-to-end UI/UX design in Figma.",
      "Angular frontend and NestJS + TypeORM backend.",
      "Deployed on Render and Neon.",
    ],
    linkLabels: { Demo: "Demo", Repositorio: "Repository" },
    mediaAlts: ["Modern workspace"],
  },
  "proj-claims-api": {
    name: "Claims Management API",
    summary: "Robust RESTful API for a vehicle dealership claims system.",
    description:
      "Robust RESTful API for a vehicle dealership claims system, with a modern architecture and Swagger docs.",
    problem: "A dealership needed a reliable backend to manage customer claims.",
    solution:
      "REST API with Node.js, Express, PostgreSQL, Sequelize, JWT auth, and Swagger documentation.",
    result: "Working API with a modern architecture and docs ready for frontend integration.",
    highlights: [
      "REST architecture with JWT authentication.",
      "PostgreSQL with Sequelize ORM.",
      "Swagger documentation for integration.",
    ],
    linkLabels: { Swagger: "Swagger", Repositorio: "Repository" },
    mediaAlts: ["Earth from space with network lights"],
  },
  "proj-verde-nido": {
    name: "Verde Nido",
    summary: "Hotel lodging platform with interactive catalog, filters, and admin CRUD.",
    description:
      "Hotel lodging platform. UI/UX design (Figma). External API with interactive catalog, advanced filters, and admin CRUD.",
    problem: "Build a hotel booking platform with an interactive catalog and admin panel.",
    solution:
      "React frontend consuming an external API, with advanced filters and admin CRUD. UI/UX in Figma.",
    result: "Working frontend platform with interactive catalog and admin management.",
    highlights: [
      "End-to-end UI/UX design in Figma.",
      "Interactive catalog with advanced filters.",
      "Admin CRUD over an external API.",
    ],
    linkLabels: { Repositorio: "Repository" },
    mediaAlts: ["Resort with pool and palm trees"],
  },
  "proj-cachibache-app": {
    name: "CachiBache — Mobile urban reporting app",
    summary:
      "UNER Final Project — mobile app to report potholes with photos, geolocation, and a real-time admin panel.",
    description:
      "Final project for the University Web Development Technician program (UNER). CachiBache lets citizens report potholes from their phones with real-time tracking via a NestJS backend deployed on Railway.",
    problem:
      "Key native features (Google Auth, push notifications, maps) did not work in the standard Expo environment. The full JWT + Refresh Token flow could not be tested on a device-like build.",
    solution:
      "Configured EAS Build from scratch and set up Google Cloud credentials for OAuth, maps, Cloudinary, and Firebase Cloud Messaging. Implemented JWT + Refresh Tokens in AuthContext and a modular NestJS architecture with SOLID principles.",
    result:
      "A real, working APK connected to the production backend, with a solid user flow, secure auth, and scalable architecture.",
    highlights: [
      "Signup, login, and password recovery with email verification and Google login.",
      "Role management (user/admin) with admin panel, filters, and status updates.",
      "Reports with photos, geolocation, interactive map, and voice dictation.",
      "Push notifications, PDF generation, and real-time mobile/backend sync.",
      "Stack: React Native + Expo, NestJS, TypeORM, PostgreSQL, JWT, Cloudinary, and Railway.",
    ],
    linkLabels: { Repositorio: "Repository" },
    mediaAlts: [
      "CachiBache — app main screen",
      "CachiBache — urban reports map",
      "CachiBache — pothole report with photo",
      "CachiBache — authentication flow",
      "CachiBache — report detail",
      "CachiBache — admin panel",
      "CachiBache — status management",
      "CachiBache — user profile",
      "CachiBache — push notifications",
      "CachiBache — mobile interface",
    ],
  },
  "proj-cachibache-game": {
    name: "CachiBache — Arcade game (GDevelop)",
    summary: "2D cartoon-style web arcade game playable in the browser via Itch.io.",
    description:
      "Integrative project for Web Multimedia and Game Development (UNER). You follow Juan Carlos, an office worker navigating potholes, cars, cows, and urban chaos to reach the hospital in time for his child's birth.",
    problem:
      "Create a fun, accessible arcade experience that complements the CachiBache identity with a Latin American narrative, playable in the browser without installation.",
    solution:
      "Built with GDevelop: simple mechanics, procedural obstacles, progressive difficulty, points and coins, and web publishing on Itch.io.",
    result:
      "Browser-playable game with intuitive controls, limited lives, 2D cartoon art, and reflex-based arcade action.",
    highlights: [
      "Procedurally generated obstacles with progressive difficulty.",
      "Simple controls, points system, and coin collection.",
      "2D cartoon art, playable directly in the browser via Itch.io.",
      "Team project — Web Multimedia and Game Development course (UNER).",
    ],
    linkLabels: { "Jugar en Itch.io": "Play on Itch.io" },
    mediaAlts: [
      "CachiBache Game — game cover",
      "CachiBache Game — arcade gameplay",
      "CachiBache Game — urban obstacles",
      "CachiBache Game — Juan Carlos character",
      "CachiBache Game — street action",
      "CachiBache Game — game screen",
    ],
  },
};

export function localizeProject(project: PortfolioProject, locale: Locale): PortfolioProject {
  if (locale !== "en") return project;

  const copy = PROJECT_EN[project.id];
  if (!copy) return project;

  return {
    ...project,
    name: copy.name,
    summary: copy.summary,
    description: copy.description,
    problem: copy.problem,
    solution: copy.solution,
    result: copy.result,
    highlights: copy.highlights,
    links: project.links.map((link) => ({
      ...link,
      label: copy.linkLabels?.[link.label] ?? link.label,
    })),
    media: project.media.map((item, index) => ({
      ...item,
      alt: copy.mediaAlts?.[index] ?? item.alt,
    })),
  };
}
