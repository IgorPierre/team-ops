"use client";

import { GithubIcon } from "lucide-react";

import { ScrollExpand } from "@/components/scroll-expand";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { GITHUB } from "@/lib/site";
import { wrap } from "@/lib/styles";

export function CtaExpand() {
  const { t } = useI18n();

  return (
    <section className={`${wrap} relative pt-4 pb-16 sm:pt-20`} aria-label={t.cta.title}>
      <ScrollExpand
        src="/two-hands.jpeg"
        alt=""
        title={
          <>
            {t.cta.titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </>
        }
        scrollHint={t.cta.scrollHint}
        useWindowScroll
        stageHeight={460}
        startWidth={42}
        startHeight={58}
        startRadius={24}
        endRadius={32}
        mediaZoom={1.35}
        scrollDistance={1.2}
        holdDistance={0.35}
        smoothing={0.1}
        overlayScrim={1}
      >
        <p
          className="max-w-[36ch] font-display text-2xl leading-[1.4] mt-10"
          style={{ color: "#fff", opacity: 1 }}
        >
          {t.cta.subtitle}
        </p>
        <Button
          variant="inverse"
          className="relative z-10 gap-2 px-8 py-3 font-brand text-[1.05rem] opacity-100"
          href={GITHUB}
          style={{ backgroundColor: "#000", color: "#fff", opacity: 1, border: "2px solid #fff" }}
        >
          {t.cta.github}
          <GithubIcon aria-hidden="true" className="size-4" />
        </Button>
      </ScrollExpand>
    </section>
  );
}
