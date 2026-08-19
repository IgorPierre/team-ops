"use client";

import Link from "next/link";

import { useI18n } from "@/i18n/provider";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABEL } from "@/i18n";
import { cn, focusRing } from "@/lib/styles";

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();

  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label={t.nav.language}>
      {LOCALES.map((code) => {
        const active = code === locale;
        const hrefLang = code === "pt" ? "pt-BR" : code;
        return (
          <Link
            key={code}
            href={`/${code}`}
            hrefLang={hrefLang}
            lang={hrefLang}
            onClick={() => {
              document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
            }}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 py-2 text-[0.8rem] tracking-[0.04em]",
              active ? "text-ink" : "text-muted hover:text-ink",
              focusRing,
            )}
            aria-current={active ? "page" : undefined}
          >
            {LOCALE_LABEL[code]}
          </Link>
        );
      })}
    </nav>
  );
}
