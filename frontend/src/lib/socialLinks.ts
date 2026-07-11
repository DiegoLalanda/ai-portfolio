export const GITHUB_URL = "https://github.com/DiegoLalanda";
export const LINKEDIN_URL = "https://www.linkedin.com/in/diego-lalanda-9576b21b8/";

export function isLinkedInUrl(url: string): boolean {
  return /linkedin\.com/i.test(url.trim());
}

/** Fuerza el perfil correcto cuando el modelo acorta o inventa la URL de LinkedIn. */
export function resolveLinkedInUrl(url: string): string {
  const trimmed = url.trim();
  if (isLinkedInUrl(trimmed)) return LINKEDIN_URL;
  return trimmed;
}
