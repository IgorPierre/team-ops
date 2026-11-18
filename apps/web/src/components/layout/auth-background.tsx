"use client";

import { useInView, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef } from "react";

const Dithering = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.Dithering),
  { ssr: false },
);

/** The landing's green dot pattern, transparent so the auth theme shows through. */
export function AuthBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const reducedMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      className="absolute inset-0 mask-[linear-gradient(to_top,white_30%,transparent_calc(100%-120px))]"
    >
      {visible ? (
        <Dithering
          colorBack="#00000000"
          colorFront="#10b981"
          shape="simplex"
          type="4x4"
          speed={reducedMotion ? 0 : 0.3}
          className="size-full"
          minPixelRatio={1}
        />
      ) : null}
    </div>
  );
}
