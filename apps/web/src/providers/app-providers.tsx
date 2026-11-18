"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { Toaster } from "@/components/ui/toaster";
import type { Locale } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/provider";

export function AppProviders({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } } }),
  );
  return (
    <I18nProvider locale={locale}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
    </I18nProvider>
  );
}
