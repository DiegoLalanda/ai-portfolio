import type { Locale } from "@/i18n/types";

/** Detecta es/en a partir del texto del visitante o de la respuesta. */
export function detectLocaleFromText(text: string): Locale {
  const sample = text.trim();
  if (!sample) return "es";

  const spanishHits =
    (sample.match(/[áéíóúñ¿¡]/gi) ?? []).length +
    (sample.match(/\b(el|la|los|las|de|del|que|con|para|como|experiencia|proyectos|habilidades|contame|mostrame)\b/gi) ?? [])
      .length;

  const englishHits = (
    sample.match(
      /\b(the|and|his|her|what|about|experience|projects|skills|tell|show|me|with|from|diego'?s)\b/gi,
    ) ?? []
  ).length;

  if (englishHits > spanishHits) return "en";
  if (spanishHits > englishHits) return "es";

  // Empate: heurística por caracteres típicos del español
  if (/[áéíóúñ¿¡]/i.test(sample)) return "es";
  return "en";
}

export function normalizeResponseLanguage(
  language: unknown,
  fallbackText: string,
): Locale {
  if (language === "en" || language === "es") return language;
  return detectLocaleFromText(fallbackText);
}
