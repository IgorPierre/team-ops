import Image from "next/image";

import { CLIS } from "@/lib/clis";
import { wrap } from "@/lib/styles";

function LogoRow({ hidden }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-x-10 px-6 sm:gap-x-16 sm:px-10 lg:gap-x-24" aria-hidden={hidden || undefined}>
      {CLIS.map((agent) => (
        <div key={agent.name} className="flex items-center gap-4 opacity-55 dark:opacity-70">
          <Image
            src={agent.src}
            alt=""
            width={48}
            height={48}
            className="size-12 brightness-0 dark:invert"
          />
          <span className="font-brand text-[1.15rem] font-semibold tracking-tight text-ink whitespace-nowrap sm:text-[1.45rem]">
            {agent.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AgentCloud({ eyebrow }: { eyebrow: string }) {
  return (
    <section className="bg-paper py-12 sm:py-24 lg:py-32">
      <div className={wrap}>
        <p className="text-center text-[0.9375rem] tracking-[0.04em] text-muted sm:text-[1.05rem]">{eyebrow}</p>
        <div className="relative mt-8 overflow-hidden sm:mt-12">
          <div className="flex w-max will-change-transform animate-logo-marquee motion-reduce:animate-none">
            <LogoRow />
            <LogoRow hidden />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 sm:w-40"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-paper from-20% to-transparent" />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 sm:w-40"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-paper from-20% to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
