"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { BoardMock } from "@/components/board-mock";
import { Button } from "@/components/ui/button";
import { wrap } from "@/lib/styles";

const Dither = dynamic(() => import("@/components/dither/dither"), { ssr: false });

const GITHUB = "https://github.com/team-ops/team-ops";
const WAVE_GREEN: [number, number, number] = [16 / 255, 185 / 255, 129 / 255];

export function Hero() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <section className={`${wrap} relative pt-4 pb-36 sm:pt-20`} id="top">
      <div className="relative isolate h-[620px] overflow-visible rounded-xl bg-graphite shadow-float">
        <div className="absolute inset-0 z-0 overflow-hidden rounded-[inherit] [&_canvas]:block [&_canvas]:!h-full [&_canvas]:!w-full" aria-hidden="true">
          <Dither
            waveColor={WAVE_GREEN}
            waveSpeed={0.05}
            waveFrequency={3}
            waveAmplitude={0.3}
            colorNum={4}
            pixelSize={2}
            disableAnimation={reduceMotion}
            enableMouseInteraction={!reduceMotion}
            mouseRadius={1}
          />
        </div>
        <div className="relative z-[1] min-w-0 max-w-2xl px-[clamp(24px,5vw,56px)] py-[clamp(28px,6vw,48px)] text-left text-accent-ink">
          <h1 className="max-w-[32ch] font-display text-[72px] leading-[1.05] font-normal tracking-[-0.03em] text-accent-ink wrap-anywhere">
            The board for humans and <mark className="bg-transparent text-accent-ink">agents.</mark>
          </h1>
          <p className="mt-5 max-w-[34ch] text-lg text-accent-ink/85">
            Open source Kanban. You host it. Agents keep it current.
          </p>
          <div className="mt-8 flex flex-wrap justify-start gap-3">
            <Button variant="solid" href="#install">
              Run it now
            </Button>
            <Button variant="ghost" href={GITHUB}>
              View source
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 z-[2] w-[min(calc(100%-32px),56rem)] -translate-x-1/2 translate-y-[38%] lg:left-auto lg:right-8 lg:w-[min(62%,56rem)] lg:translate-x-0">
          <BoardMock variant="hero" />
        </div>
      </div>
    </section>
  );
}
