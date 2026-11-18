"use client";

import { LanguagesIcon } from "lucide-react";

import { focusRing } from "@/components/ui/styles";
import { LOCALE_NAME, LOCALES, useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Compact language picker for the signed-out screens (sign-in, sign-up, consent). */
export function LocaleSwitcher({ className }: { className?: string }) {
  const [locale, setLocale] = useLocale();
  const t = useT();
  return (
    <div
      role="radiogroup"
      aria-label={t("Language")}
      className={cn("flex items-center gap-1", className)}
    >
      <LanguagesIcon
        className="text-muted-foreground mr-1 size-4"
        aria-hidden="true"
      />
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          role="radio"
          aria-checked={code === locale}
          lang={code}
          title={LOCALE_NAME[code]}
          onClick={() => setLocale(code)}
          className={cn(
            "h-7 rounded-md px-2 text-xs font-medium uppercase transition-colors",
            code === locale
              ? "bg-active text-active-foreground"
              : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
            focusRing,
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
