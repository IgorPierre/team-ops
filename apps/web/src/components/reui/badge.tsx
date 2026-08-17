import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-1.5 py-0 text-[11px] font-medium capitalize",
  {
    variants: {
      variant: {
        outline: "text-foreground",
        "destructive-outline": "border-destructive/40 text-destructive",
        "primary-outline": "border-primary/40 text-primary",
        "warning-outline": "border-amber-500/40 text-amber-700 dark:text-amber-400",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
