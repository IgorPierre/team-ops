"use client";

import { cn } from "@/lib/utils";

import { focusRing } from "./styles";

export interface TabOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Optional count shown after the label. */
  count?: number;
}

/**
 * Carbon tabs: a muted track with the selected tab raised on it. Button-group
 * style tabs (single choice). Keyboard: Tab to the group, then
 * the buttons are regular toggle buttons.
 */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  fill = false,
}: {
  value: T;
  onChange: (value: T) => void;
  options: TabOption<T>[];
  /** Accessible name of the group. */
  label: string;
  className?: string;
  /** Stretch buttons to fill the container. */
  fill?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "bg-muted text-muted-foreground inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[0.5rem] border p-0.5",
        fill ? "flex w-full" : "w-fit",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value || "all"}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-7 items-center justify-center gap-1.5 rounded-[6px] border border-transparent px-3 text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow]",
              fill && "flex-1",
              selected
                ? "bg-card text-foreground shadow-button-base dark:bg-background"
                : "hover:text-foreground",
              focusRing,
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "bg-secondary text-secondary-foreground rounded-md px-1.5 text-xs font-semibold tabular-nums",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
