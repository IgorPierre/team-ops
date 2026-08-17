import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/styles";

const variants = {
  solid:
    "bg-accent text-accent-ink hover:-translate-y-[1.5px] hover:bg-accent-2 active:translate-y-0",
  ghost:
    "border-white/40 bg-white/10 text-accent-ink hover:border-white/70",
  accent:
    "bg-accent text-accent-ink hover:-translate-y-[1.5px] hover:bg-accent-2 active:translate-y-0",
  text: "text-ink-2 hover:text-ink",
  pill: "border-rule bg-paper text-ink hover:border-ink-2",
} as const;

type Variant = keyof typeof variants;

type ButtonProps = ComponentPropsWithoutRef<"a"> & {
  variant?: Variant;
};

export function Button({ variant = "accent", className, ...props }: ButtonProps) {
  return (
    <a
      className={cn(
        "inline-flex w-fit items-center justify-center whitespace-nowrap rounded-full border border-transparent px-6 py-2 text-[16px] font-medium",
        "transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-focus",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
