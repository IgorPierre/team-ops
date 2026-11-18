/** Same locales and cookie as the landing page, so a choice made there carries over. */
export const LOCALES = ["en", "pt", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const HTML_LANG: Record<Locale, string> = { en: "en", pt: "pt-BR", es: "es" };
export const LOCALE_NAME: Record<Locale, string> = { en: "English", pt: "Português", es: "Español" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Best match for an Accept-Language header or navigator.language ("pt-BR,pt;q=0.9" → "pt"). */
export function matchLocale(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  for (const part of header.split(",")) {
    const base = part.split(";")[0].trim().toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/** Translations keyed by the English source string; a missing key falls back to English. */
export type Catalog = { pt: Record<string, string>; es: Record<string, string> };
