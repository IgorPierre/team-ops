import { cva, type VariantProps } from "class-variance-authority";
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  Clock5Icon,
  ScanSearchIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/** Carbon's badge: soft tinted fill, no border, 24px tall, semibold 12px. */
export const badgeVariants = cva(
  "inline-flex w-fit min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 font-semibold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      color: {
        gray: "bg-zinc-100 text-[#777777] dark:bg-zinc-500/15 dark:text-zinc-400",
        green: "bg-emerald-50 text-[#3f9e53] dark:bg-emerald-500/15 dark:text-emerald-400",
        yellow: "bg-yellow-50 text-[#c98a12] dark:bg-yellow-500/15 dark:text-yellow-400",
        orange: "bg-orange-50 text-[#d9893b] dark:bg-orange-500/15 dark:text-orange-400",
        red: "bg-rose-50 text-[#D57463] dark:bg-red-500/15 dark:text-red-400",
        blue: "bg-sky-100 text-[#008AF5] dark:bg-blue-500/15 dark:text-blue-400",
        purple: "bg-violet-50 text-[#6C3CF0] dark:bg-violet-500/15 dark:text-violet-400",
        solid: "bg-primary text-primary-foreground",
        outline: "border-border text-foreground border",
        // Semantic aliases used across the app.
        brand: "bg-emerald-50 text-[#3f9e53] dark:bg-emerald-500/15 dark:text-emerald-400",
        success: "bg-emerald-50 text-[#3f9e53] dark:bg-emerald-500/15 dark:text-emerald-400",
        warning: "bg-orange-50 text-[#d9893b] dark:bg-orange-500/15 dark:text-orange-400",
        error: "bg-rose-50 text-[#D57463] dark:bg-red-500/15 dark:text-red-400",
        indigo: "bg-sky-100 text-[#008AF5] dark:bg-blue-500/15 dark:text-blue-400",
      },
      size: {
        sm: "min-h-6 text-[12px]",
        md: "min-h-7 px-2.5 text-[13px]",
      },
    },
    defaultVariants: { color: "gray", size: "sm" },
  },
);

export type BadgeColor = NonNullable<VariantProps<typeof badgeVariants>["color"]>;

export function Badge({
  className,
  color,
  size,
  dot = false,
  children,
  ...props
}: Omit<React.ComponentProps<"span">, "color"> &
  VariantProps<typeof badgeVariants> & {
    /** Leading dot in the badge's colour. */
    dot?: boolean;
  }) {
  return (
    <span className={cn(badgeVariants({ color, size }), className)} {...props}>
      {dot ? <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

const STATUS_ICONS: Partial<Record<BadgeColor, React.ComponentType<{ strokeWidth?: number }>>> = {
  green: CircleCheckIcon,
  success: CircleCheckIcon,
  brand: CircleCheckIcon,
  orange: TriangleAlertIcon,
  warning: TriangleAlertIcon,
  red: CircleXIcon,
  error: CircleXIcon,
  yellow: ScanSearchIcon,
  blue: CircleDashedIcon,
  indigo: CircleDashedIcon,
  purple: Clock5Icon,
  gray: Clock5Icon,
};

/** Carbon's `Status`: a badge led by an icon that matches its colour. */
export function Status({
  color = "gray",
  icon,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"span">, "color"> & {
  color?: BadgeColor;
  /** Override the icon picked from the colour. */
  icon?: React.ReactNode;
}) {
  const Icon = STATUS_ICONS[color] ?? Clock5Icon;
  return (
    <Badge color={color} className={className} {...props}>
      {icon ?? <Icon strokeWidth={3} aria-hidden="true" />}
      {children}
    </Badge>
  );
}
