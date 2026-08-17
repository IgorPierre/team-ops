"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

import { useIsVisible } from "@/lib/use-is-visible";

const Dithering = dynamic(() => import("@paper-design/shaders-react").then((mod) => mod.Dithering), { ssr: false });

export function AgnosticBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIsVisible(ref);

  return (
    <div
      ref={ref}
      className="absolute inset-0 mask-[linear-gradient(to_top,white_30%,transparent_calc(100%-120px))]"
    >
      <Dithering
        colorBack="#00000000"
        colorFront="#10b981"
        shape="simplex"
        type="4x4"
        speed={visible ? 0.3 : 0}
        className="size-full"
        minPixelRatio={1}
      />
    </div>
  );
}
