"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import { MetaBalls } from "@/components/meta-balls";
import { LogoMark } from "@/components/logo-mark";
import { ACCENT_HEX } from "@/lib/site";

const STORAGE_KEY = "team-ops:preloader";
const MIN_MS = 1100;
const MAX_MS = 2400;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function alreadySeen() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

function releaseDocument() {
  document.documentElement.removeAttribute("data-preloading");
}

export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (alreadySeen() || prefersReducedMotion()) {
      releaseDocument();
      markSeen();
      return;
    }

    document.documentElement.dataset.preloading = "1";
    setShow(true);

    const started = performance.now();
    let finished = false;
    let readyTimer = 0;

    const exit = () => {
      if (finished) return;
      finished = true;
      markSeen();
      const el = rootRef.current;
      if (!el) {
        releaseDocument();
        setShow(false);
        return;
      }
      gsap.to(el, {
        yPercent: -100,
        duration: 0.85,
        ease: "power4.inOut",
        onComplete: () => {
          releaseDocument();
          setShow(false);
        },
      });
    };

    const waitForReady = () => {
      const elapsed = performance.now() - started;
      const remain = Math.max(0, MIN_MS - elapsed);
      readyTimer = window.setTimeout(exit, remain);
    };

    const onLoad = () => waitForReady();
    const cap = window.setTimeout(exit, MAX_MS);

    if (document.readyState === "complete") waitForReady();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      window.clearTimeout(cap);
      window.clearTimeout(readyTimer);
      window.removeEventListener("load", onLoad);
      gsap.killTweensOf(rootRef.current);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-graphite"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="absolute inset-0">
        <MetaBalls
          color={ACCENT_HEX}
          cursorBallColor={ACCENT_HEX}
          cursorBallSize={2}
          ballCount={15}
          animationSize={30}
          enableMouseInteraction
          enableTransparency
          hoverSmoothness={0.15}
          clumpFactor={1}
          speed={0.3}
          pixelSize={3}
          colorNum={4}
        />
      </div>
      <p className="pointer-events-none relative z-[1] inline-flex items-center gap-3 font-display text-[clamp(2rem,5vw,3.25rem)] leading-none tracking-[-0.03em] text-graphite-ink">
        <LogoMark className="h-[0.85em]" />
        Team-Ops
      </p>
    </div>
  );
}
