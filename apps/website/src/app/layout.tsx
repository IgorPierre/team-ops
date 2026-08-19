import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { DEFAULT_LOCALE, HTML_LANG, isLocale } from "@/i18n";

import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display-face",
  weight: "400",
  style: ["normal", "italic"],
});
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono-face",
});

export const metadata: Metadata = {
  title: "Team-Ops: the board for humans and agents",
  description:
    "Self-hosted engineering Kanban. Humans use the board. Agents use the API and MCP. PostgreSQL you control.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const raw = (await headers()).get("x-locale") ?? DEFAULT_LOCALE;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (
    <html lang={HTML_LANG[locale]} suppressHydrationWarning>
      <body className={`${serif.className} ${serif.variable} ${mono.variable} font-sans antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(!sessionStorage.getItem("team-ops:preloader"))document.documentElement.setAttribute("data-preloading","1")}catch(e){}try{var t=localStorage.getItem("team-ops:theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <div
          className="pointer-events-none fixed inset-0 z-[70] mix-blend-multiply opacity-[0.04] dark:mix-blend-overlay dark:opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
          aria-hidden="true"
        />
        <div className="mx-auto w-full min-w-0 max-w-page">{children}</div>
      </body>
    </html>
  );
}
