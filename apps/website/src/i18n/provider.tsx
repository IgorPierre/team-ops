"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Locale, Messages } from "./types";

const I18nContext = createContext<{ locale: Locale; t: Messages } | null>(null);

export function I18nProvider({
  locale,
  t,
  children,
}: {
  locale: Locale;
  t: Messages;
  children: ReactNode;
}) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
