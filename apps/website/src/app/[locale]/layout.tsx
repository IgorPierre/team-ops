import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { I18nProvider } from "@/i18n/provider";
import { getMessages, isLocale, LOCALES, type Locale } from "@/i18n";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getMessages(locale);
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${isLocale(locale) ? locale : "en"}`,
      languages: {
        en: "/en",
        "pt-BR": "/pt",
        es: "/es",
        "x-default": "/en",
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getMessages(locale);

  return (
    <I18nProvider locale={locale} t={t}>
      {children}
    </I18nProvider>
  );
}
