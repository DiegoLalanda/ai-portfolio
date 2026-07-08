export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";
export const LOCALES: Locale[] = ["es", "en"];

export interface Suggestion {
  id: string;
  label: string;
  question: string;
}

export interface Translations {
  meta: {
    title: string;
  };
  hero: {
    greeting: string;
    name: string;
    roles: [string, string, string];
    tagline: string;
  };
  prompts: {
    placeholders: string[];
    sendAriaLabel: string;
  };
  suggestions: Suggestion[];
  loading: {
    label: string;
    messages: string[];
  };
  errors: {
    connectionTitle: string;
    connectionSummary: string;
  };
  footer: {
    tagline: string;
    getInTouch: string;
  };
  langSwitcher: {
    ariaLabel: string;
  };
}
