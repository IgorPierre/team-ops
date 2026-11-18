"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Ported from Carbon's BarProgress (@carbon/react): a row of 2px ticks that
// fills left to right, sized to however many ticks fit the container.
const BAR_WIDTH = 2;
const BAR_HEIGHT = 14;
const BAR_GAP = 3;

type Rgb = [number, number, number];
type GradientStop = { pos: number; color: Rgb };

function lerpColor(a: Rgb, b: Rgb, t: number) {
  const channel = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${channel(0)},${channel(1)},${channel(2)})`;
}

// red -> yellow -> green
const GRADIENT_STOPS: GradientStop[] = [
  { pos: 0, color: [239, 68, 68] },
  { pos: 0.5, color: [234, 179, 8] },
  { pos: 0.8, color: [34, 197, 94] },
  { pos: 1, color: [34, 197, 94] },
];

// green -> yellow -> red
const GRADIENT_STOPS_INVERTED: GradientStop[] = [
  { pos: 0, color: [34, 197, 94] },
  { pos: 0.2, color: [34, 197, 94] },
  { pos: 0.5, color: [234, 179, 8] },
  { pos: 0.8, color: [239, 68, 68] },
  { pos: 1, color: [239, 68, 68] },
];

function gradientColor(ratio: number, stops: GradientStop[]) {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  for (let i = 0; i < stops.length - 1; i++) {
    const curr = stops[i];
    const next = stops[i + 1];
    if (clamped >= curr.pos && clamped <= next.pos) {
      return lerpColor(curr.color, next.color, (clamped - curr.pos) / (next.pos - curr.pos));
    }
  }
  return lerpColor(stops[0].color, stops[0].color, 0);
}

export interface BarProgressProps {
  /** Numeric progress value. */
  progress: number;
  /** Maximum progress value (default: 100). */
  max?: number;
  /** Label above-left of the bar. */
  label?: React.ReactNode;
  /** Value string above-right of the bar. */
  value?: string;
  /** Red → yellow → green gradient across the filled ticks. */
  gradient?: boolean;
  /** Green → yellow → red instead. */
  invertGradient?: boolean;
  /** Multi-segment progress, rendered in order (ignores progress/gradient). */
  segments?: { value: number; className: string }[];
  className?: string;
  /** Filled tick colour (ignored with `gradient`). */
  activeClassName?: string;
  /** Empty tick colour. */
  inactiveClassName?: string;
  /** Accessible name when there is no text label. */
  "aria-label"?: string;
}

export function BarProgress({
  progress,
  max = 100,
  label,
  value,
  gradient = false,
  invertGradient = false,
  segments,
  className,
  activeClassName = "bg-theme",
  inactiveClassName = "bg-foreground/10",
  "aria-label": ariaLabel,
}: BarProgressProps) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const [barCount, setBarCount] = useState(0);

  const calculateBars = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    setBarCount(Math.max(Math.floor((width + BAR_GAP) / (BAR_WIDTH + BAR_GAP)), 1));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    calculateBars();
    const observer = new ResizeObserver(calculateBars);
    observer.observe(el);
    return () => observer.disconnect();
  }, [calculateBars]);

  const clamped = Math.min(Math.max(progress, 0), max);
  const percentage = max > 0 ? (clamped / max) * 100 : 0;
  const activeBars = max > 0 ? Math.round((clamped / max) * barCount) : 0;

  const barClassName = (i: number) => {
    if (segments && barCount > 0) {
      let cumulative = 0;
      for (const seg of segments) {
        cumulative += Math.round((seg.value / max) * barCount);
        if (i < cumulative) return seg.className;
      }
      return inactiveClassName;
    }
    const active = i < activeBars;
    if (gradient && active) return "";
    return active ? activeClassName : inactiveClassName;
  };

  const barStyle = (i: number): React.CSSProperties | undefined => {
    if (segments || !gradient || i >= activeBars || barCount === 0) return undefined;
    return {
      backgroundColor: gradientColor(i / (barCount - 1 || 1), invertGradient ? GRADIENT_STOPS_INVERTED : GRADIENT_STOPS),
    };
  };

  return (
    <div className={cn("w-full", className)}>
      {label || value ? (
        <div className="mb-0.5 flex items-baseline justify-between gap-2">
          {label ? <span className="text-foreground truncate text-sm font-medium">{label}</span> : <div />}
          {value ? <span className="text-muted-foreground font-mono text-xs tabular-nums">{value}</span> : null}
        </div>
      ) : null}
      <div
        ref={containerRef}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel ?? (typeof label === "string" ? label : t("Progress"))}
        className="flex w-full items-center gap-[3px] overflow-hidden"
      >
        {Array.from({ length: barCount }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn("shrink-0 rounded-[2px] transition-colors duration-200", barClassName(i))}
            style={{ width: BAR_WIDTH, height: BAR_HEIGHT, ...barStyle(i) }}
          />
        ))}
        <span className="sr-only">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}
