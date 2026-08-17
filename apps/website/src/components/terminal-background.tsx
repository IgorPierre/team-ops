"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FaultyTerminal = dynamic(() => import("@/components/faulty-terminal"), { ssr: false });

export function TerminalBackground() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-y-0 right-0 w-[52%] min-w-[10rem] [mask-image:linear-gradient(to_right,transparent_0%,black_42%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_42%)]">
        <FaultyTerminal
          tint="#10b981"
          pause={reduceMotion}
          mouseReact={!reduceMotion}
          pageLoadAnimation={!reduceMotion}
          brightness={1}
          scanlineIntensity={0.35}
          curvature={0.18}
        />
      </div>
    </div>
  );
}
