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
    <section className={`${wrap} relative pt-2 pb-4 sm:pt-20 sm:pb-6`} id="top">
      <div className="relative isolate overflow-hidden rounded-lg bg-graphite shadow-float sm:rounded-xl sm:min-h-[380px] lg:h-[460px]">
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
        <RevealLoad className="pointer-events-none relative z-[1] min-w-0 max-w-5xl px-4 py-6 text-left text-accent-ink sm:px-12 sm:py-10 lg:px-18 lg:py-12">
          <RevealItem>
            <h1 className="w-full font-display text-[clamp(1.625rem,9vw,6rem)] leading-[1.08] font-normal tracking-[-0.03em] text-accent-ink">
              {t.hero.title1}
              <br />
              {t.hero.title2}
            </h1>
          </RevealItem>
          <RevealItem>
            <p
              className="mt-3 max-w-[44ch] font-display text-[clamp(0.9375rem,3.8vw,1.85rem)] leading-[1.45] tracking-[-0.02em] sm:mt-5 sm:leading-[1.4]"
              style={{ color: "#fff", opacity: 1 }}
            >
              {t.hero.subtitle}
            </p>
          </RevealItem>
          <RevealItem>
            <div className="pointer-events-auto mt-5 flex w-full flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
              <Button className="w-full justify-center px-5 text-[0.9375rem] sm:w-fit sm:px-6 sm:text-[16px]" variant="solid" href={GITHUB}>
                {t.hero.runItNow}
              </Button>
              <Button className="w-full justify-center gap-2 px-5 text-[0.9375rem] sm:w-fit sm:px-6 sm:text-[16px]" variant="ghost" href={GITHUB}>
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
