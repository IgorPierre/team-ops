import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-muted-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        high: "border-transparent bg-destructive/10 text-destructive",
        medium: "border-transparent bg-primary/10 text-primary",
        low: "border-transparent bg-muted text-muted-foreground",
        success: "border-transparent bg-success/12 text-success",
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
