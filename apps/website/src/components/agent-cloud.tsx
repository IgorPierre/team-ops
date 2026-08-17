import Image from "next/image";

import { CLIS } from "@/lib/clis";
import { wrap } from "@/lib/styles";

function LogoRow({ hidden }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-x-16 px-10 sm:gap-x-24" aria-hidden={hidden || undefined}>
      {CLIS.map((agent) => (
        <div key={agent.name} className="flex items-center gap-4 opacity-50">
          <Image
            src={agent.src}
            alt=""
            width={48}
            height={48}
            className="size-12 brightness-0"
          />
          <span className="font-brand text-[1.45rem] font-semibold tracking-tight text-ink whitespace-nowrap">
            {agent.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AgentCloud({ eyebrow }: { eyebrow: string }) {
  return (
    <section className="bg-paper py-24 sm:py-32">
      <div className={wrap}>
        <p className="text-center text-[1.05rem] tracking-[0.04em] text-muted">{eyebrow}</p>
        <div className="relative mt-12 overflow-hidden">
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
