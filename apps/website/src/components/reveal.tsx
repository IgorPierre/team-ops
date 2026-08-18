"use client";

import * as motion from "motion/react-client";
import type { ReactNode } from "react";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const viewport = { once: true, amount: 0.22, margin: "0px 0px -8% 0px" } as const;

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE_OUT },
  },
};

const group = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const load = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      data-reveal=""
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={{
        hidden: item.hidden,
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.42, delay, ease: EASE_OUT },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      data-reveal=""
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={group}
    >
      {children}
    </motion.div>
  );
}

export function RevealLoad({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} data-reveal="" initial="hidden" animate="visible" variants={load}>
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} data-reveal="" variants={item}>
      {children}
    </motion.div>
  );
}
