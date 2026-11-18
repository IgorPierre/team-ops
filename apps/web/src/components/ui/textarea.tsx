import { cn } from "@/lib/utils";

import { controlBase, focusRing } from "./styles";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlBase, focusRing, "max-h-[20lh] min-h-24 px-3 py-2 text-sm leading-relaxed", className)}
      {...props}
    />
  );
}
