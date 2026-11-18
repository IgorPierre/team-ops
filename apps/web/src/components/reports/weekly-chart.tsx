"use client";

import type { Report } from "@team-ops/api-client";
import { useState } from "react";

import { intlLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SERIES = [
  { key: "created", label: "count|Created", color: "var(--chart-2)" },
  { key: "completed", label: "count|Completed", color: "var(--chart-1)" },
] as const;

const HEIGHT = 200;

export function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(intlLocale(), { month: "short", day: "numeric" });
}

export function ChartLegend() {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {SERIES.map((s) => (
        <span key={s.key} className="text-muted-foreground inline-flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: s.color }} />
          {t(s.label)}
        </span>
      ))}
    </div>
  );
}

/** Grouped bars per week: created vs completed. Hover or focus a week for exact numbers. */
export function WeeklyChart({ weeks }: { weeks: Report["weekly"] }) {
  const t = useT();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...weeks.flatMap((w) => [w.created, w.completed]));
  const ticks = [0, Math.ceil(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);
  const y = (v: number) => HEIGHT - (v / max) * HEIGHT;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="text-subtle-foreground relative w-6 shrink-0 text-right text-xs tabular-nums" style={{ height: HEIGHT }}>
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: y(tick) }}>
              {tick}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1 overflow-x-auto">
          <div className="relative flex items-end gap-1" style={{ height: HEIGHT, minWidth: weeks.length * 24 }}>
            {ticks.map((tick) => (
              <div
                key={tick}
                className={cn("pointer-events-none absolute inset-x-0 border-t", tick !== 0 && "border-dashed")}
                style={{ top: y(tick) }}
              />
            ))}
            {weeks.map((w, i) => (
              <div
                key={w.weekStart}
                className={cn(
                  "relative flex h-full flex-1 items-end justify-center gap-0.5 rounded-md outline-none",
                  hover === i && "bg-accent/70",
                )}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={t("Week of {date}: {created} created, {completed} completed", {
                  date: shortDate(w.weekStart),
                  created: w.created,
                  completed: w.completed,
                })}
              >
                {SERIES.map((s) => {
                  const v = w[s.key];
                  return (
                    <div
                      key={s.key}
                      className="w-full max-w-3.5 rounded-t-[3px]"
                      style={{ height: v ? Math.max(2, (v / max) * HEIGHT) : 0, background: s.color }}
                    />
                  );
                })}
                {hover === i ? (
                  <div
                    className={cn(
                      "bg-primary text-primary-foreground pointer-events-none absolute top-1 z-10 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg",
                      i >= weeks.length / 2 ? "right-full mr-1.5" : "left-full ml-1.5",
                    )}
                  >
                    <p className="mb-1 font-semibold">{t("Week of {date}", { date: shortDate(w.weekStart) })}</p>
                    {SERIES.map((s) => (
                      <p key={s.key} className="flex items-center gap-1.5 opacity-90">
                        <span className="size-2 rounded-full" style={{ background: s.color }} />
                        {t(s.label)} <span className="ml-auto pl-4 font-semibold tabular-nums">{w[s.key]}</span>
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="text-subtle-foreground mt-2 flex gap-1 text-xs" style={{ minWidth: weeks.length * 24 }}>
            {weeks.map((w, i) => (
              <span key={w.weekStart} className="flex-1 truncate text-center">
                {weeks.length <= 8 || i % Math.ceil(weeks.length / 8) === 0 ? shortDate(w.weekStart) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <details className="text-sm">
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium">
          {t("Show as table")}
        </summary>
        <table className="mt-3 w-full text-sm tabular-nums">
          <thead className="text-muted-foreground text-left text-xs">
            <tr>
              <th className="py-2 font-medium">{t("Week of")}</th>
              <th className="py-2 text-right font-medium">{t("count|Created")}</th>
              <th className="py-2 text-right font-medium">{t("count|Completed")}</th>
            </tr>
          </thead>
          <tbody className="divide-y border-t">
            {weeks.map((w) => (
              <tr key={w.weekStart}>
                <td className="py-2">{shortDate(w.weekStart)}</td>
                <td className="py-2 text-right">{w.created}</td>
                <td className="py-2 text-right">{w.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
