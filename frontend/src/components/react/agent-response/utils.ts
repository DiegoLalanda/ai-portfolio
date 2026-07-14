/**
 * Helpers de parseo defensivo para `Widget["data"]`.
 *
 * `data` llega tipado como `Record<string, unknown>` a propósito (ver
 * `src/types/agent-response.ts`): cada widget es responsable de leer su
 * propio payload. Estas funciones evitan repetir el mismo chequeo de tipo
 * en cada componente y hacen que un campo faltante o mal formado degrade a
 * un valor vacío en vez de romper el render.
 */

export function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asStringArray(value: unknown): string[] {
  return asArray<unknown>(value).filter((item): item is string => typeof item === "string");
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}
