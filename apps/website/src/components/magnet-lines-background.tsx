"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import MagnetLines from "@/components/magnet-lines";

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

let observer: IntersectionObserver;
const observerTargets = new WeakMap<Element, (entry: IntersectionObserverEntry) => void>();

function useIsVisible(ref: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        observerTargets.get(entry.target)?.(entry);
      }
    });

    const element = ref.current;
    if (!element) return;
    observerTargets.set(element, (entry) => setVisible(entry.isIntersecting));
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observerTargets.delete(element);
    };
  }, [ref]);

  return visible;
}
