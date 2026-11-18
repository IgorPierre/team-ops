import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("text-muted-foreground text-xs leading-none font-medium peer-disabled:opacity-70", className)}
      {...props}
    />
  );
}
