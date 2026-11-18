"use client";

import { motion, useReducedMotion } from "framer-motion";

// Adapted from Hirael Login 03 (MIT), Mohammad Shehadeh — as used by Carbon's sign-in.
export function FloatingPaths({ position }: { position: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      aria-hidden="true"
      className="text-primary absolute inset-0 h-full w-full opacity-60"
      fill="none"
      viewBox="0 0 696 316"
    >
      {Array.from({ length: 36 }, (_, i) => {
        const jitter = Math.sin(i + 1) * 10_000;
        return (
          <motion.path
            key={i}
            d={`M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${
              312 - i * 5 * position
            } ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
              684 - i * 5 * position
            } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`}
            initial={{ pathLength: 0.3 }}
            animate={
              reduceMotion
                ? { pathLength: 0.3, pathOffset: 0 }
                : { pathLength: 1, pathOffset: [0, 1, 0] }
            }
            stroke="currentColor"
            strokeOpacity={Math.min(1, 0.1 + i * 0.03)}
            strokeWidth={0.5 + i * 0.03}
            transition={{
              duration: reduceMotion
                ? 0
                : 20 + (jitter - Math.floor(jitter)) * 10,
              repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        );
      })}
    </svg>
  );
}
