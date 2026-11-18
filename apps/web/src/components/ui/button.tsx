import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Carbon's button: gradient primary, press scale, blue focus halo drawn by ::after. */
export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap select-none",
    "transform-gpu transition-[background-color,color,transform,box-shadow] duration-150 ease-out",
    "active:scale-[0.96] active:duration-75 motion-reduce:transform-none",
    "outline-none after:pointer-events-none after:absolute after:-inset-[3px] after:rounded-lg after:border after:border-blue-500 after:opacity-0 after:ring-2 after:ring-blue-500/20 after:transition-opacity focus-visible:after:opacity-100 active:after:opacity-0",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary:
          "from-primary/90 to-primary text-primary-foreground bg-gradient-to-br shadow-[inset_0px_0.5px_0px_rgb(255_255_255_/_0.32)] saturate-[105%] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/[0.12] before:opacity-0 before:transition-opacity hover:before:opacity-100",
        secondary:
          "bg-card text-foreground shadow-button-base hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50",
        active: "bg-active text-active-foreground hover:bg-active/90 dark:shadow-button-base",
        solid: "bg-accent text-accent-foreground hover:bg-accent/90",
        ghost: "text-accent-foreground hover:bg-primary/10",
        tertiary: "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
        outline: "border-border text-foreground hover:bg-accent border bg-transparent",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[inset_0px_0.5px_0px_rgb(255_255_255_/_0.32)] hover:bg-destructive/90",
        "destructive-secondary":
          "bg-card text-destructive shadow-button-base hover:bg-destructive/10 dark:bg-input/30",
        link: "text-foreground h-auto px-0 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-6 rounded-sm px-2 text-xs",
        md: "h-8 rounded-md px-4 text-sm",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "size-8 rounded-md p-2",
        "icon-sm": "size-6 rounded-sm p-1 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    compoundVariants: [{ variant: "link", class: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      // Default to "button" so a Button inside a form never submits by accident.
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
