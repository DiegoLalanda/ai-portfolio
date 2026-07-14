import type { AgentResponse, KnownWidgetType, SuggestedAction } from "@/types/agent-response";

const TOPIC_PATTERNS: Partial<Record<KnownWidgetType, RegExp[]>> = {
  projects: [/proyecto/i, /project/i, /portfolio/i, /case study/i],
  experience: [/experiencia/i, /experience/i, /trabajo/i, /empleo/i, /rol/i],
  education: [/educaci/i, /education/i, /formaci/i, /universidad/i, /estudio/i],
  skills: [/skill/i, /habilidad/i, /stack/i, /tecnolog/i, /competenc/i],
  contact: [/contact/i, /contacto/i, /email/i, /reach/i],
  timeline: [/timeline/i, /línea de tiempo/i, /linea de tiempo/i, /cronolog/i],
  certifications: [/certif/i, /curso/i, /diploma/i, /credencial/i, /credential/i],
  languages: [/idioma/i, /language/i, /english/i, /inglés/i, /portugués/i, /português/i],
  "soft-skills": [/soft.?skill/i, /habilidad blanda/i, /interpersonal/i, /teamwork/i, /trabajo en equipo/i],
};

export interface DashboardSessionContext {
  shownWidgetTypes: string[];
  priorQuestions: string[];
}

export function collectShownWidgetTypes(responses: AgentResponse[]): string[] {
  const types = new Set<string>();
  for (const response of responses) {
    for (const widget of response.widgets) {
      types.add(widget.type);
    }
  }
  return [...types];
}

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim()) || /^mailto:/i.test(value.trim());
}

function labelToQuestion(label: string): string {
  const trimmed = label.trim();
  if (trimmed.endsWith("?")) return trimmed;

  const viewMatch = trimmed.match(/^(?:Ver|See)\s+(.+)$/i);
  if (viewMatch) {
    const topic = viewMatch[1].replace(/\.$/, "");
    return `Contame sobre ${topic}.`;
  }

  if (/contactar|contact\s+diego|get in touch|reach out/i.test(trimmed)) {
    return "¿Cómo puedo contactar a Diego?";
  }

  return `${trimmed.replace(/\.$/, "")}?`;
}

/** Las sugerencias del dashboard siempre reenvían una pregunta al agente, nunca abren links. */
export function normalizeSuggestedAction(action: SuggestedAction): SuggestedAction {
  if (action.action === "ask" && !isExternalUrl(action.payload)) {
    return action;
  }

  const payload = action.payload.trim();
  const question = isExternalUrl(payload) || !payload ? labelToQuestion(action.label) : payload;

  return {
    label: action.label,
    action: "ask",
    payload: question,
  };
}

function actionTargetsWidgetType(action: SuggestedAction): string | null {
  const text = `${action.label} ${action.payload}`.toLowerCase();
  for (const [type, patterns] of Object.entries(TOPIC_PATTERNS) as [KnownWidgetType, RegExp[]][]) {
    if (patterns.some((pattern) => pattern.test(text))) return type;
  }
  return null;
}

/** Quita sugerencias que repetirían un widget ya visible en el dashboard. */
export function filterSuggestedActions(
  actions: SuggestedAction[],
  shownWidgetTypes: Iterable<string>,
): SuggestedAction[] {
  const shown = new Set(shownWidgetTypes);
  const seen = new Set<string>();

  return actions
    .filter((action) => {
      const target = actionTargetsWidgetType(action);
      if (target && shown.has(target)) return false;

      const normalized = normalizeSuggestedAction(action);
      const dedupeKey = `${normalized.action}:${normalized.payload.trim().toLowerCase()}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);

      return true;
    })
    .map(normalizeSuggestedAction);
}

export function withFilteredSuggestions(
  response: AgentResponse,
  shownWidgetTypes: Iterable<string>,
): AgentResponse {
  return {
    ...response,
    suggested_actions: filterSuggestedActions(response.suggested_actions, shownWidgetTypes),
  };
}
