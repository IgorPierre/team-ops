"use client";

import { MenuIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { LogoMark } from "@/components/logo-mark";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { GITHUB } from "@/lib/site";
import { cn, focusRing, wrap } from "@/lib/styles";

export function SiteNav() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#product", label: t.nav.product },
    { href: "#agents", label: t.nav.agents },
    { href: "#faq", label: t.nav.faq },
  ];

  useEffect(() => {
    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        frame = 0;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b pt-[env(safe-area-inset-top,0px)]",
        scrolled ? "border-rule bg-paper/80 backdrop-blur-lg backdrop-saturate-150" : "border-transparent bg-transparent",
      )}
    >
      <div className={cn(wrap, "grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:min-h-16 sm:gap-3 lg:grid-cols-[1fr_auto_1fr] lg:gap-4")}>
        <a className="inline-flex min-w-0 items-center gap-1.5 font-display text-[1rem] text-ink sm:gap-2 sm:text-[1.15rem]" href="#top">
          <LogoMark />
          <span className="truncate">Team-Ops</span>
        </a>
        <nav className="hidden justify-self-center gap-1 lg:flex" aria-label={t.nav.primary}>
          {links.map((link) => (
            <a
              key={link.href}
              className={cn(
                "inline-flex items-center rounded-full px-3 py-2 text-[1rem] whitespace-nowrap text-ink-2 hover:text-ink",
                focusRing,
              )}
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex min-w-0 items-center justify-self-end gap-2">
          <LocaleSwitcher className="hidden sm:flex" />
          <ThemeToggle className="hidden lg:inline-flex" />
          <Button variant="text" href={GITHUB} className="hidden lg:inline-flex">
            {t.nav.source}
          </Button>
          <Button variant="accent" href={GITHUB} className="hidden lg:inline-flex">
            {t.nav.runIt}
          </Button>
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-rule bg-paper text-ink lg:hidden",
              focusRing,
            )}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon className="size-5" aria-hidden="true" /> : <MenuIcon className="size-5" aria-hidden="true" />}
            <span className="sr-only">{t.nav.menu}</span>
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          className="grid gap-2 border-b border-rule bg-paper px-[clamp(16px,4vw,64px)] py-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden"
          aria-label={t.nav.mobile}
        >
          {links.map((link) => (
            <a
              key={link.href}
              className={cn("inline-flex min-h-11 items-center py-2", focusRing)}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href={GITHUB}
            className={cn("inline-flex min-h-11 items-center py-2", focusRing)}
            onClick={() => setOpen(false)}
          >
            {t.nav.viewSource}
          </a>
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      ) : null}
    </header>
  );
}
