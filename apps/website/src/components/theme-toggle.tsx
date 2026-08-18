"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/provider";
import { cn, focusRing } from "@/lib/styles";

const STORAGE_KEY = "team-ops:theme";

function isDarkNow() {
  return document.documentElement.classList.contains("dark");
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDarkNow());
  }, []);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center rounded-full border border-rule bg-paper p-0.5",
        focusRing,
        className,
      )}
      aria-label={dark ? t.nav.themeToLight : t.nav.themeToDark}
      aria-pressed={dark}
      onClick={() => {
        const next = !isDarkNow();
        applyTheme(next);
        setDark(next);
      }}
    >
      <span
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full",
          dark ? "text-muted" : "bg-paper-3 text-ink",
        )}
        aria-hidden="true"
      >
        <SunIcon className="size-4" strokeWidth={1.75} />
      </span>
      <span
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full",
          dark ? "bg-paper-3 text-ink" : "text-muted",
        )}
        aria-hidden="true"
      >
        <MoonIcon className="size-4" strokeWidth={1.75} />
      </span>
    </button>
  );
}
