import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { controlBase, focusRing } from "./styles";

export type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  /** Icon rendered inside the field, before the text. */
  leadingIcon?: LucideIcon;
  /** `sm` (32px) for toolbars and filters, `md` (40px) for forms. */
  size?: "sm" | "md";
};

const HEIGHT = { sm: "h-8", md: "h-10 max-md:h-11" } as const;

/** `className` sizes the outer element, so width utilities work with or without an icon. */
export function Input({ className, leadingIcon: Icon, size = "md", ...props }: InputProps) {
  if (!Icon) {
    return <input className={cn(controlBase, focusRing, HEIGHT[size], "px-3 text-sm", className)} {...props} />;
  }
  return (
    <div className={cn("relative w-full", className)}>
      <Icon
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <input className={cn(controlBase, focusRing, HEIGHT[size], "pr-3 pl-9 text-sm")} {...props} />
    </div>
  );
}
