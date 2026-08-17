"use client";

import { useEffect, useState } from "react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { cn, focusRing, wrap } from "@/lib/styles";

const GITHUB = "https://github.com/team-ops/team-ops";

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
    document.body.style.overflow = open ? "clip" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b",
        scrolled ? "border-rule bg-paper/80 backdrop-blur-lg backdrop-saturate-150" : "border-transparent bg-transparent",
      )}
    >
      <div className={cn(wrap, "grid min-h-16 grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]")}>
        <a className="inline-flex items-center gap-2 whitespace-nowrap font-display text-[1.15rem] text-ink" href="#top">
          <span className="inline-grid size-3.5 grid-cols-2 gap-0.5" aria-hidden="true">
            <span className="rounded-[1px] bg-accent" />
            <span className="rounded-[1px] bg-accent" />
            <span className="rounded-[1px] bg-accent" />
            <span className="rounded-[1px] bg-accent" />
          </span>
          Team-Ops
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
        <div className="flex items-center justify-self-end gap-2">
          <LocaleSwitcher className="hidden sm:flex" />
          <Button variant="text" href={GITHUB}>
            {t.nav.source}
          </Button>
          <Button variant="accent" href={GITHUB}>
            {t.nav.runIt}
          </Button>
          <button
            type="button"
            className={cn(
              "rounded-full border border-rule bg-paper px-3 py-2 text-[0.85rem] text-ink lg:hidden",
              focusRing,
            )}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {t.nav.menu}
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          className="grid gap-3 border-b border-rule bg-paper px-[clamp(24px,4vw,64px)] py-3 pb-6 lg:hidden"
          aria-label={t.nav.mobile}
        >
          {links.map((link) => (
            <a key={link.href} className="py-3" href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <a href={GITHUB} onClick={() => setOpen(false)}>
            {t.nav.viewSource}
          </a>
          <LocaleSwitcher />
        </nav>
      ) : null}
    </header>
  );
}
