import { ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { controlBase, focusRing } from "./styles";

/** Native select styled like the other controls: accessible and mobile-friendly. */
export function Select({
  className,
  size = "md",
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & { size?: "sm" | "md" }) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        className={cn(
          controlBase,
          focusRing,
          size === "sm" ? "h-8" : "h-10 max-md:h-11",
          "cursor-pointer appearance-none truncate pr-9 pl-3 text-sm")}
        {...props}
      />
      <ChevronsUpDownIcon
        className="text-muted-foreground/70 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
    </div>
  );
}
