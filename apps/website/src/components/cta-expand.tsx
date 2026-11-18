"use client";

import { GithubIcon } from "lucide-react";

import { CipherReach } from "@/components/cipher-reach";
import { ScrollExpand } from "@/components/scroll-expand";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { GITHUB } from "@/lib/site";
import { wrap } from "@/lib/styles";

export function CtaExpand() {
  const { t } = useI18n();

  return (
    <section className={`${wrap} relative pt-2 pb-10 sm:pt-20 sm:pb-16`} aria-label={t.cta.title}>
      <ScrollExpand
        media={<CipherReach />}
        title={
          <>
            {t.cta.titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </>
        }
        useWindowScroll
        stageHeight={460}
        startWidth={36}
        startHeight={52}
        startRadius={16}
        endRadius={24}
        mediaZoom={1.25}
        scrollDistance={1.1}
        holdDistance={0.3}
        smoothing={0.1}
        overlayScrim={1}
      >
        <p
          className="media-copy max-w-[42ch] text-[clamp(1rem,2.5vw,1.25rem)] leading-[1.5]"
          style={{ color: "#fff", opacity: 1 }}
        >
          {t.cta.subtitle}
        </p>
        <Button
          variant="inverse"
          className="relative z-10 w-full justify-center gap-2 px-6 py-3 font-brand text-[0.9375rem] opacity-100 sm:w-fit sm:px-8 sm:text-[1.05rem]"
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
