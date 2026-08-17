import type { HTMLAttributes } from "react";

import { cn } from "@/lib/styles";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "light" | "dark";
};

export function Chip({ tone = "light", className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-[0.8rem]",
        tone === "dark"
          ? "border-white/20 bg-black/25 text-white/90"
          : "border-rule bg-paper text-ink-2",
        className,
      )}
      {...props}
    />
  );
}

export function ChipList({
  items,
  tone = "light",
  className,
}: {
  items: readonly string[];
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <Chip key={item} tone={tone}>
          {item}
        </Chip>
      ))}
    </div>
  );
}
