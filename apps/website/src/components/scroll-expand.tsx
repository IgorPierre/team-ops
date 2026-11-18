"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { cn } from "@/lib/styles";

import "./scroll-expand.css";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

type LiveProps = {
  startWidth: number;
  startHeight: number;
  startRadius: number;
  endRadius: number;
  mediaZoom: number;
  scrollDistance: number;
  holdDistance: number;
  smoothing: number;
  overlayScrim: number;
  useWindowScroll: boolean;
  enabled: boolean;
  stageHeight: number | null;
};

export type ScrollExpandProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  src?: string;
  mediaType?: "image" | "video";
  /** Custom media (e.g. a canvas) used instead of `src`; zoomed like an image. */
  media?: ReactNode;
  poster?: string;
  alt?: string;
  title?: ReactNode;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  useWindowScroll?: boolean;
  enabled?: boolean;
  stageHeight?: number;
  children?: ReactNode;
  style?: CSSProperties;
};

export function ScrollExpand({
  src,
  mediaType = "image",
  media: customMedia,
  poster = "",
  alt = "",
  title = "",
  scrollHint = "",
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  useWindowScroll = false,
  enabled = true,
  stageHeight,
  children,
  className = "",
  style,
  ...rest
}: ScrollExpandProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  const propsRef = useRef<LiveProps>({
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
    stageHeight: stageHeight ?? null,
  });
  propsRef.current = {
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
    stageHeight: stageHeight ?? null,
  };

  const applyProgress = useCallback((p: number) => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;

    const e = smoothstep(0, 1, p);

    const rootW = rootRef.current?.clientWidth || frame.parentElement?.clientWidth || 800;
    const narrow = rootW < 400;
    const startW = narrow ? Math.min(c.startWidth, 28) : c.startWidth;
    const startH = narrow ? Math.min(c.startHeight, 50) : c.startHeight;

    const w = startW + (100 - startW) * e;
    const h = startH + (100 - startH) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;

    if (scrimRef.current) scrimRef.current.style.opacity = `${c.overlayScrim}`;

    if (titleRef.current) {
      const toRow = smoothstep(0.28, 0.78, p);
      const el = titleRef.current;
      const stageW = el.parentElement?.clientWidth || 800;
      const narrow = stageW < 400;
      el.style.flexDirection = narrow || toRow <= 0.45 ? "column" : "row";
      el.style.gap = narrow ? "0.15em" : `${0.4 * toRow}em`;
      const stacked = Number.parseFloat(getComputedStyle(el).getPropertyValue("--se-title-size")) || 64;
      const beside = clamp(stageW * 0.042, 28, 52);
      const rowBlend = narrow ? 0 : toRow;
      el.style.fontSize = `${stacked + (beside - stacked) * rowBlend}px`;
      el.style.transform = "none";
      el.style.lineHeight = narrow ? "1.12" : "1.02";
    }

    if (hintRef.current) {
      const gone = smoothstep(0, 0.12, p);
      hintRef.current.style.opacity = `${1 - gone}`;
      hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }


  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;

    const resolveStageHeight = (c: LiveProps) => {
      if (c.stageHeight == null) {
        return c.useWindowScroll ? window.innerHeight : root.clientHeight;
      }
      const w = root.clientWidth || window.innerWidth;
      if (w < 400) {
        return Math.round(Math.min(c.stageHeight, Math.max(280, window.innerHeight * 0.62)));
      }
      if (w < 640) {
        return Math.round(Math.min(c.stageHeight, Math.max(320, window.innerHeight * 0.55)));
      }
      if (w < 1024) {
        return Math.min(c.stageHeight, 400);
      }
      return c.stageHeight;
    };

    const measure = () => {
      const c = propsRef.current;
      stageH = resolveStageHeight(c);
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      const expand = reduceMotion || !c.enabled || c.useWindowScroll ? 0 : Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance);
      track.style.height = `${stageH * (1 + expand)}px`;

      const w = root.clientWidth || stageH;
      const titleSize = w < 400 ? clamp(w * 0.1, 26, 84) : clamp(w * 0.075, 20, 84);
      stage.style.setProperty("--se-title-size", `${titleSize}px`);
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled || reduceMotion) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp((window.innerHeight - top) / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    if (reduceMotion) return;

    const scroller: Window | HTMLDivElement = useWindowScroll ? window : root;
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [applyProgress, useWindowScroll]);

  const media = customMedia ? (
    <div
      ref={(node) => {
        mediaRef.current = node;
      }}
      className="scroll-expand__media"
    >
      {customMedia}
    </div>
  ) : mediaType === "video" ? (
      <video
        ref={(node) => {
          mediaRef.current = node;
        }}
        className="scroll-expand__media"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      // Native img: clip-path + per-frame scale need the element, not a Next Image wrapper.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={(node) => {
          mediaRef.current = node;
        }}
        className="scroll-expand__media"
        src={src}
        alt={alt}
        draggable={false}
      />
    );

  return (
    <div
      ref={rootRef}
      className={cn("scroll-expand", !useWindowScroll && "scroll-expand--scroller", className)}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            {media}
            <div ref={scrimRef} className="scroll-expand__scrim" />
          </div>
          {title ? (
            <h2 ref={titleRef} className="scroll-expand__title">
              {title}
            </h2>
          ) : null}
          {children ? (
            <div ref={overlayRef} className="scroll-expand__overlay">
              {children}
            </div>
          ) : null}
          {scrollHint ? (
            <div ref={hintRef} className="scroll-expand__hint" aria-hidden>
              {scrollHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
