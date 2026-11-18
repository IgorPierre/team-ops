"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

import { CATALOG } from "./catalog";
import { DEFAULT_LOCALE, HTML_LANG, LOCALE_COOKIE, type Locale } from "./config";

export * from "./config";

export type TranslateVars = Record<string, string | number>;

let current: Locale = DEFAULT_LOCALE;

/** Locale chosen on the server for this request; the server snapshot for the hooks. */
export const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);
const listeners = new Set<() => void>();

/** Set by I18nProvider before children render; also used by setLocale. */
export function setCurrentLocale(locale: Locale) {
  current = locale;
}

export function getLocale(): Locale {
  return current;
}

/** BCP 47 tag for Intl / toLocaleString. */
export function intlLocale(locale: Locale = current) {
  return HTML_LANG[locale];
}

/**
 * Translate an English source string into the current locale.
 * `{name}` placeholders are filled from `vars`. Unknown keys stay English.
 * A `context|` prefix ("count|Created") separates the same English word used
 * with a different meaning; it is dropped from the English fallback.
 */
export function translate(key: string, vars?: TranslateVars, locale: Locale = current): string {
  const english = key.includes("|") ? key.slice(key.indexOf("|") + 1) : key;
  const text = locale === "en" ? english : (CATALOG[locale][key] ?? english);
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function changeLocale(locale: Locale) {
  current = locale;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = HTML_LANG[locale];
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** `t` for the current locale; the component re-renders when the language changes. */
export function useT() {
  const locale = useLocaleValue();
  return useCallback((key: string, vars?: TranslateVars) => translate(key, vars, locale), [locale]);
}

function useLocaleValue() {
  const serverLocale = useContext(LocaleContext);
  return useSyncExternalStore(subscribe, getLocale, () => serverLocale);
}

export function useLocale() {
  return [useLocaleValue(), changeLocale] as const;
}
