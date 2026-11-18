"use client";

import type { Locale } from "./config";
import { LocaleContext, setCurrentLocale } from "./index";

/**
 * Provides the locale picked on the server (cookie, then Accept-Language).
 * Also seeds the module-level locale so plain helpers (date and due-date
 * formatting) translate too.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  setCurrentLocale(locale);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
