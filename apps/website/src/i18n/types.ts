export const LOCALES = ["en", "pt", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  pt: "pt-BR",
  es: "es",
};

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
};

export type FaqItem = { q: string; a: string };

export type Messages = {
  meta: { title: string; description: string };
  nav: {
    product: string;
    agents: string;
    faq: string;
    source: string;
    runIt: string;
    menu: string;
    viewSource: string;
    primary: string;
    mobile: string;
    language: string;
  };
  hero: {
    title1: string;
    title2: string;
    subtitle: string;
    runItNow: string;
    viewSource: string;
  };
  cloud: { eyebrow: string };
  quote: { text: string; caption: string };
  product: {
    title: string;
    p1: string;
    p2: string;
    install: string;
  };
  agents: {
    title: string;
    lead: string;
    tryItOut: string;
    needs: string;
    runStackFirst: string;
    terminal: string;
    caption: string;
    inProgress: string;
    copied: string;
    copy: string;
    copyAria: string;
    copiedAria: string;
  };
  features: {
    aTitle: string;
    aBody: string;
    bTitle: string;
    bBody: string;
    bCta: string;
    cTitle: string;
    cBody: string;
    cCta: string;
    dTitle: string;
    dBody: string;
    dCta: string;
  };
  faq: { title: string; items: FaqItem[] };
  cta: { title: string; github: string };
  footer: { install: string; faq: string; security: string; nav: string };
};
