/**
 * Contrato de respuesta estructurada del agente de IA (backend <-> frontend).
 *
 * Espejo en TypeScript de `backend/app/schemas/agent_response.py`. Agregar
 * un tipo de widget nuevo es: sumarlo acá (opcional, solo para autocompletado),
 * crear su componente en `src/components/react/agent-response/widgets/` y
 * registrarlo en `widgetRegistry.ts`. Ver también
 * `backend/app/schemas/README.md` para la forma de `data` de cada tipo.
 */

/** Catálogo de tipos de widget conocidos hoy por este frontend. */
export type KnownWidgetType =
  | "text"
  | "timeline"
  | "skills"
  | "projects"
  | "technology-cloud"
  | "education"
  | "contact"
  | "experience"
  | "certifications"
  | "languages"
  | "soft-skills";

export interface Widget {
  id: string;
  /**
   * `KnownWidgetType | (string & {})` a propósito: si el backend evoluciona
   * y manda un `type` que este frontend todavía no conoce, el tipado no debe
   * romperse ni el render explotar, solo debe caer en `FallbackWidget` (ver
   * `widgetRegistry.ts`).
   */
  type: KnownWidgetType | (string & {});
  title?: string | null;
  data: Record<string, unknown>;
}

export type ActionType = "ask" | "link" | "contact";

export interface SuggestedAction {
  label: string;
  action: ActionType;
  payload: string;
}

export interface AgentResponse {
  /** Idioma de la pregunta del visitante; define cómo se localizan los widgets. */
  language?: "es" | "en";
  title: string;
  summary: string;
  widgets: Widget[];
  suggested_actions: SuggestedAction[];
}
