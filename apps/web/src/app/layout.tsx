import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";

import { HTML_LANG, isLocale, LOCALE_COOKIE, matchLocale } from "@/lib/i18n/config";
import { THEME_COLOR_SCRIPT } from "@/lib/theme-color";
import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: { default: "Team-Ops", template: "%s · Team-Ops" },
  description: "The self-hosted engineering board for humans and AI agents.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : matchLocale((await headers()).get("accept-language"));

  return (
    <html lang={HTML_LANG[locale]} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_COLOR_SCRIPT }} />
      </head>
      <body className={`${sans.variable} ${mono.variable} font-sans text-sm antialiased`}>
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
