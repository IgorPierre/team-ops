"use client";

import { GithubIcon } from "lucide-react";
import dynamic from "next/dynamic";

import { RevealItem, RevealLoad } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { ACCENT_WAVE, GITHUB } from "@/lib/site";
import { wrap } from "@/lib/styles";

const Dither = dynamic(() => import("@/components/dither/dither"), { ssr: false });

export function Hero() {
  const { t } = useI18n();

  return (
    <section className={`${wrap} relative pt-4 pb-6 sm:pt-20`} id="top">
      <div className="relative isolate h-[460px] overflow-visible rounded-xl bg-graphite shadow-float">
        <div className="absolute inset-0 z-0 overflow-hidden rounded-[inherit] [&_canvas]:block [&_canvas]:!h-full [&_canvas]:!w-full">
          <Dither
            waveColor={ACCENT_WAVE}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={0.3}
            colorNum={4}
            waveAmplitude={0.33}
            waveFrequency={3}
            waveSpeed={0.01}
          />
        </div>
        <RevealLoad className="pointer-events-none relative z-[1] min-w-0 max-w-5xl px-18 py-12 text-left text-accent-ink">
          <RevealItem>
            <h1 className="w-full font-display text-[clamp(3.25rem,6.2vw,6rem)] leading-[1.05] font-normal tracking-[-0.03em] text-accent-ink">
              {t.hero.title1}
              <br />
              {t.hero.title2}
            </h1>
          </RevealItem>
          <RevealItem>
            <p
              className="mt-5 max-w-[44ch] font-display text-[clamp(1.5rem,2.4vw,1.85rem)] leading-[1.4] tracking-[-0.02em]"
              style={{ color: "#fff", opacity: 1 }}
            >
              {t.hero.subtitle}
            </p>
          </RevealItem>
          <RevealItem>
            <div className="mt-8 flex flex-wrap justify-start gap-3">
              <Button className="pointer-events-auto" variant="solid" href={GITHUB}>
                {t.hero.runItNow}
              </Button>
              <Button className="pointer-events-auto gap-2" variant="ghost" href={GITHUB}>
                {t.hero.viewSource}
                <GithubIcon aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </RevealItem>
        </RevealLoad>
      </div>
    </section>
  );
}
