"use client";

import { useRef } from "react";

import MagnetLines from "@/components/magnet-lines";
import { useIsVisible } from "@/lib/use-is-visible";

export function MagnetLinesBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIsVisible(ref);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-55 mask-[linear-gradient(to_top,white_30%,transparent_calc(100%-120px))]"
      aria-hidden
    >
      <MagnetLines
        rows={9}
        columns={12}
        containerSize="100%"
        lineColor="var(--color-accent)"
        lineWidth="2px"
        lineHeight="30px"
        baseAngle={-10}
        active={visible}
        style={{ width: "100%", height: "100%", margin: 0 }}
      />
    </div>
  );
}
