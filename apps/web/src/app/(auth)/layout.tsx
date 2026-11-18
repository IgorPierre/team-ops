"use client";

import { AuthBackground } from "@/components/layout/auth-background";
import { Brand } from "@/components/layout/brand";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { useT } from "@/lib/i18n";

/** Theme-aware auth panel with the landing's green dot pattern. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <main className="bg-card grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col overflow-hidden bg-zinc-100 p-10 lg:flex dark:border-r dark:bg-zinc-900">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <AuthBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-100 dark:to-zinc-900" />
        </div>
        <Brand className="relative z-10 text-lg" />
        <p className="text-foreground relative z-10 mt-auto max-w-lg text-[36px] leading-[1.1] font-medium tracking-tight text-balance md:text-[44px]">
          {t("Ship with your agents. The board keeps up.")}
        </p>
      </div>
      <div className="relative flex items-center justify-center px-4 py-16 lg:p-8">
        <LocaleSwitcher className="absolute top-4 right-4" />
        {children}
      </div>
    </main>
  );
}
