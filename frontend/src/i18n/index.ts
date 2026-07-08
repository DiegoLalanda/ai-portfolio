import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { DEFAULT_LOCALE, LOCALES, type Locale, type Translations } from "@/i18n/types";

const catalogs: Record<Locale, Translations> = { es, en };

export function getTranslations(locale: Locale): Translations {
  return catalogs[locale] ?? catalogs[DEFAULT_LOCALE];
}

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function localePath(locale: Locale, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === "es") {
    return normalized;
  }
  if (normalized === "/") {
    return "/en/";
  }
  return `/en${normalized}`;
}

export function localeFromPathname(pathname: string): Locale {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return "en";
  }
  return "es";
}

export { DEFAULT_LOCALE, LOCALES, type Locale, type Translations };
