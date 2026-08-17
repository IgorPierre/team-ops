"use client";

import { type RefObject, useEffect, useState } from "react";

let observer: IntersectionObserver | undefined;
const observerTargets = new WeakMap<Element, (entry: IntersectionObserverEntry) => void>();

export function useIsVisible(ref: RefObject<HTMLElement | null>) {
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
      observer?.unobserve(element);
      observerTargets.delete(element);
    };
  }, [ref]);

  return visible;
}
