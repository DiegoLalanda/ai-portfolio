/**
 * Iconos de skills: Devicon cuando existe logo de marca; Lucide para el resto.
 */

import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Boxes,
  Brain,
  BrainCircuit,
  Cloud,
  Database,
  Gamepad2,
  Gauge,
  HardDrive,
  Hash,
  Layers,
  Library,
  LineChart,
  Link2,
  MessageSquareText,
  Network,
  Plug,
  Radio,
  Rocket,
  ScanSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Table,
  TestTube2,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";

export interface SkillCategoryMeta {
  label: string;
  accentClass: string;
  accentDot: string;
}

export type LucideIconKey =
  | "brain"
  | "bot"
  | "layers"
  | "sparkles"
  | "message-square"
  | "hash"
  | "plug"
  | "brain-circuit"
  | "line-chart"
  | "scan-search"
  | "search"
  | "library"
  | "database"
  | "hard-drive"
  | "cloud"
  | "boxes"
  | "network"
  | "radio"
  | "test-tube"
  | "shield"
  | "shopping-cart"
  | "gamepad"
  | "zap"
  | "link"
  | "table"
  | "gauge"
  | "rocket"
  | "workflow"
  | "webhook";

export type SkillIconRef =
  | { provider: "devicon"; slug: string; variant?: string; invert?: boolean }
  | { provider: "simpleicons"; slug: string; invert?: boolean }
  | { provider: "lucide"; icon: LucideIconKey };

const CATEGORY_META: Record<string, SkillCategoryMeta> = {
  ai: {
    label: "AI / ML",
    accentClass: "text-[#e6c07b]",
    accentDot: "bg-[#e6c07b]",
  },
  "cloud-devops": {
    label: "Cloud & DevOps",
    accentClass: "text-[#4cd7f6]",
    accentDot: "bg-[#4cd7f6]",
  },
  frontend: {
    label: "Frontend",
    accentClass: "text-[#f2b8c6]",
    accentDot: "bg-[#f2b8c6]",
  },
  "backend-data": {
    label: "Backend & Data",
    accentClass: "text-[#9adbc6]",
    accentDot: "bg-[#9adbc6]",
  },
  "design-cms-other": {
    label: "Design & Tools",
    accentClass: "text-[#d0bcff]",
    accentDot: "bg-[#d0bcff]",
  },
  gamedev: {
    label: "Game Dev",
    accentClass: "text-[#ffb86c]",
    accentDot: "bg-[#ffb86c]",
  },
};

const LUCIDE_ICONS: Record<LucideIconKey, LucideIcon> = {
  brain: Brain,
  bot: Bot,
  layers: Layers,
  sparkles: Sparkles,
  "message-square": MessageSquareText,
  hash: Hash,
  plug: Plug,
  "brain-circuit": BrainCircuit,
  "line-chart": LineChart,
  "scan-search": ScanSearch,
  search: Search,
  library: Library,
  database: Database,
  "hard-drive": HardDrive,
  cloud: Cloud,
  boxes: Boxes,
  network: Network,
  radio: Radio,
  "test-tube": TestTube2,
  shield: ShieldCheck,
  "shopping-cart": ShoppingCart,
  gamepad: Gamepad2,
  zap: Zap,
  link: Link2,
  table: Table,
  gauge: Gauge,
  rocket: Rocket,
  workflow: Workflow,
  webhook: Webhook,
};

/** Devicon solo cuando hay logo de marca fiable; si no, Lucide semántico. */
const BY_ID: Record<string, SkillIconRef> = {
  "skill-python": { provider: "devicon", slug: "python" },
  "skill-fastapi": { provider: "devicon", slug: "fastapi" },
  "skill-ai-agents": { provider: "lucide", icon: "bot" },
  "skill-llms": { provider: "lucide", icon: "brain" },
  "skill-rag": { provider: "lucide", icon: "layers" },
  "skill-embeddings": { provider: "lucide", icon: "sparkles" },
  "skill-prompt-engineering": { provider: "lucide", icon: "message-square" },
  "skill-tokenization": { provider: "lucide", icon: "hash" },
  "skill-mcp": { provider: "lucide", icon: "plug" },
  "skill-strands": { provider: "lucide", icon: "workflow" },
  "skill-amazon-bedrock": { provider: "lucide", icon: "brain-circuit" },
  "skill-bot-development": { provider: "lucide", icon: "bot" },
  "skill-async": { provider: "lucide", icon: "zap" },
  "skill-langfuse": { provider: "lucide", icon: "line-chart" },
  "skill-vector-search": { provider: "lucide", icon: "scan-search" },
  "skill-semantic-search": { provider: "lucide", icon: "search" },
  "skill-knowledge-bases": { provider: "lucide", icon: "library" },
  "skill-ollama": { provider: "simpleicons", slug: "ollama", invert: true },

  "skill-aws-s3": { provider: "lucide", icon: "hard-drive" },
  "skill-dynamodb": { provider: "lucide", icon: "database" },
  "skill-amazon-aurora": { provider: "lucide", icon: "database" },
  "skill-amazon-athena": { provider: "lucide", icon: "table" },
  "skill-aws-glue": { provider: "lucide", icon: "link" },
  "skill-aws": { provider: "devicon", slug: "amazonwebservices", variant: "plain-wordmark" },
  "skill-docker": { provider: "devicon", slug: "docker" },
  "skill-kubernetes": { provider: "devicon", slug: "kubernetes" },
  "skill-git-github": { provider: "devicon", slug: "github" },
  "skill-nginx": { provider: "devicon", slug: "nginx" },
  "skill-pm2": { provider: "lucide", icon: "gauge" },
  "skill-render": { provider: "lucide", icon: "cloud" },
  "skill-neon": { provider: "lucide", icon: "database" },
  "skill-railway": { provider: "lucide", icon: "rocket" },
  "skill-jenkins": { provider: "devicon", slug: "jenkins" },
  "skill-cicd": { provider: "devicon", slug: "jenkins" },
  "skill-sonarqube": { provider: "simpleicons", slug: "sonarqube" },
  "skill-grafana": { provider: "devicon", slug: "grafana" },
  "skill-eas-build": { provider: "devicon", slug: "expo", variant: "original", invert: true },
  "skill-linux-zorin": { provider: "devicon", slug: "linux" },

  "skill-react": { provider: "devicon", slug: "react" },
  "skill-angular": { provider: "devicon", slug: "angular" },
  "skill-react-native-expo": { provider: "devicon", slug: "expo", variant: "original", invert: true },
  "skill-typescript": { provider: "devicon", slug: "typescript" },
  "skill-javascript": { provider: "devicon", slug: "javascript" },
  "skill-html5": { provider: "devicon", slug: "html5" },
  "skill-css3": { provider: "devicon", slug: "css3" },
  "skill-tailwind-css": { provider: "devicon", slug: "tailwindcss" },
  "skill-astro": { provider: "devicon", slug: "astro" },

  "skill-nestjs": { provider: "devicon", slug: "nestjs" },
  "skill-nodejs": { provider: "devicon", slug: "nodejs" },
  "skill-express": { provider: "devicon", slug: "express" },
  "skill-postgresql": { provider: "devicon", slug: "postgresql" },
  "skill-mysql": { provider: "devicon", slug: "mysql" },
  "skill-typeorm": { provider: "lucide", icon: "database" },
  "skill-sequelize": { provider: "devicon", slug: "sequelize" },
  "skill-redis": { provider: "devicon", slug: "redis" },
  "skill-websockets": { provider: "lucide", icon: "radio" },
  "skill-microservices": { provider: "lucide", icon: "boxes" },
  "skill-distributed-systems": { provider: "lucide", icon: "network" },
  "skill-rest-apis": { provider: "lucide", icon: "webhook" },
  "skill-unit-testing": { provider: "lucide", icon: "test-tube" },

  "skill-figma": { provider: "devicon", slug: "figma" },
  "skill-adobe-photoshop": { provider: "devicon", slug: "photoshop" },
  "skill-wordpress": { provider: "devicon", slug: "wordpress" },
  "skill-woocommerce": { provider: "lucide", icon: "shopping-cart" },
  "skill-jira": { provider: "devicon", slug: "jira" },
  "skill-google-workspace": { provider: "devicon", slug: "google" },
  "skill-it-audit": { provider: "lucide", icon: "shield" },

  "skill-gdevelop": { provider: "lucide", icon: "gamepad" },
  "skill-unity": { provider: "devicon", slug: "unity" },
};

const BY_NAME: Record<string, SkillIconRef> = {
  python: { provider: "devicon", slug: "python" },
  fastapi: { provider: "devicon", slug: "fastapi" },
  "agentes de ia": { provider: "lucide", icon: "bot" },
  agentic: { provider: "lucide", icon: "bot" },
  llms: { provider: "lucide", icon: "brain" },
  llm: { provider: "lucide", icon: "brain" },
  rag: { provider: "lucide", icon: "layers" },
  embeddings: { provider: "lucide", icon: "sparkles" },
  "prompt engineering": { provider: "lucide", icon: "message-square" },
  tokenizacion: { provider: "lucide", icon: "hash" },
  mcp: { provider: "lucide", icon: "plug" },
  strands: { provider: "lucide", icon: "workflow" },
  "amazon bedrock": { provider: "lucide", icon: "brain-circuit" },
  bedrock: { provider: "lucide", icon: "brain-circuit" },
  "desarrollo de bots": { provider: "lucide", icon: "bot" },
  ollama: { provider: "simpleicons", slug: "ollama", invert: true },
  langfuse: { provider: "lucide", icon: "line-chart" },
  "busqueda vectorial": { provider: "lucide", icon: "scan-search" },
  "vector search": { provider: "lucide", icon: "scan-search" },
  "busqueda semantica": { provider: "lucide", icon: "search" },
  "knowledge bases": { provider: "lucide", icon: "library" },
  kb: { provider: "lucide", icon: "library" },
  "async / concurrencia": { provider: "lucide", icon: "zap" },
  async: { provider: "lucide", icon: "zap" },

  aws: { provider: "devicon", slug: "amazonwebservices", variant: "plain-wordmark" },
  "amazon s3": { provider: "lucide", icon: "hard-drive" },
  dynamodb: { provider: "lucide", icon: "database" },
  nosql: { provider: "lucide", icon: "database" },
  "amazon aurora": { provider: "lucide", icon: "database" },
  "amazon athena": { provider: "lucide", icon: "table" },
  "aws glue": { provider: "lucide", icon: "link" },
  docker: { provider: "devicon", slug: "docker" },
  kubernetes: { provider: "devicon", slug: "kubernetes" },
  k8s: { provider: "devicon", slug: "kubernetes" },
  jenkins: { provider: "devicon", slug: "jenkins" },
  "ci/cd": { provider: "devicon", slug: "jenkins" },
  cicd: { provider: "devicon", slug: "jenkins" },
  sonarqube: { provider: "simpleicons", slug: "sonarqube" },
  grafana: { provider: "devicon", slug: "grafana" },
  observabilidad: { provider: "devicon", slug: "grafana" },
  pm2: { provider: "lucide", icon: "gauge" },
  render: { provider: "lucide", icon: "cloud" },
  neon: { provider: "lucide", icon: "database" },
  railway: { provider: "lucide", icon: "rocket" },
  "linux (zorin os)": { provider: "devicon", slug: "linux" },
  linux: { provider: "devicon", slug: "linux" },
  zorin: { provider: "devicon", slug: "linux" },

  react: { provider: "devicon", slug: "react" },
  angular: { provider: "devicon", slug: "angular" },
  typescript: { provider: "devicon", slug: "typescript" },
  javascript: { provider: "devicon", slug: "javascript" },
  "javascript (es6+)": { provider: "devicon", slug: "javascript" },
  html5: { provider: "devicon", slug: "html5" },
  html: { provider: "devicon", slug: "html5" },
  css3: { provider: "devicon", slug: "css3" },
  css: { provider: "devicon", slug: "css3" },
  "tailwind css": { provider: "devicon", slug: "tailwindcss" },
  tailwind: { provider: "devicon", slug: "tailwindcss" },
  astro: { provider: "devicon", slug: "astro" },
  "react native + expo": { provider: "devicon", slug: "expo", variant: "original", invert: true },
  expo: { provider: "devicon", slug: "expo", variant: "original", invert: true },

  nestjs: { provider: "devicon", slug: "nestjs" },
  "node.js": { provider: "devicon", slug: "nodejs" },
  nodejs: { provider: "devicon", slug: "nodejs" },
  "express.js": { provider: "devicon", slug: "express" },
  postgresql: { provider: "devicon", slug: "postgresql" },
  mysql: { provider: "devicon", slug: "mysql" },
  typeorm: { provider: "lucide", icon: "database" },
  redis: { provider: "devicon", slug: "redis" },
  microservicios: { provider: "lucide", icon: "boxes" },
  "sistemas distribuidos": { provider: "lucide", icon: "network" },
  "api rest": { provider: "lucide", icon: "webhook" },
  "testing unitario": { provider: "lucide", icon: "test-tube" },
  websockets: { provider: "lucide", icon: "radio" },

  figma: { provider: "devicon", slug: "figma" },
  "adobe photoshop": { provider: "devicon", slug: "photoshop" },
  wordpress: { provider: "devicon", slug: "wordpress" },
  woocommerce: { provider: "lucide", icon: "shopping-cart" },
  "auditoria it": { provider: "lucide", icon: "shield" },
  unity: { provider: "devicon", slug: "unity" },
  gdevelop: { provider: "lucide", icon: "gamepad" },
};

export function normalizeSkillKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^skill-/, "");
}

export function resolveSkillIcon(skill: string): SkillIconRef | null {
  const raw = skill.trim();
  if (!raw) return null;

  if (BY_ID[raw]) return BY_ID[raw];

  const normalized = normalizeSkillKey(raw);
  if (BY_ID[`skill-${normalized}`]) return BY_ID[`skill-${normalized}`];
  if (BY_NAME[normalized]) return BY_NAME[normalized];

  const compact = normalized
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/[^a-z0-9+.# ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (BY_NAME[compact]) return BY_NAME[compact];

  return null;
}

export function getLucideIcon(name: LucideIconKey): LucideIcon {
  return LUCIDE_ICONS[name];
}

export function skillIconUrls(ref: SkillIconRef): string[] {
  if (ref.provider === "lucide") return [];
  if (ref.provider === "simpleicons") {
    return [`https://cdn.simpleicons.org/${ref.slug}`];
  }

  const variant = ref.variant ?? "original";
  const urls = [
    `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${ref.slug}/${ref.slug}-${variant}.svg`,
  ];
  if (variant !== "plain") {
    urls.push(
      `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${ref.slug}/${ref.slug}-plain.svg`,
    );
  }
  if (variant !== "original") {
    urls.push(
      `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${ref.slug}/${ref.slug}-original.svg`,
    );
  }
  return urls;
}

export function shouldInvertIcon(ref: SkillIconRef | null): boolean {
  if (!ref || ref.provider === "lucide") return false;
  return Boolean(ref.invert);
}

export function getCategoryMeta(category: string): SkillCategoryMeta {
  if (CATEGORY_META[category]) return CATEGORY_META[category];

  const pretty = category.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    label: pretty,
    accentClass: "text-primary",
    accentDot: "bg-primary",
  };
}

export function skillInitials(name: string) {
  const cleaned = name.replace(/^skill-/, "").trim();
  const parts = cleaned.split(/[\s/+_-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
