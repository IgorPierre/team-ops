import { cn } from "@/lib/utils";

/** Native checkbox with the design-system look. */
export function Checkbox({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "accent-primary size-4 shrink-0 cursor-pointer rounded-[4px] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}
