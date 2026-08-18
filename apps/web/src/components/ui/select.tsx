import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full appearance-none rounded-md border px-3 pr-8 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <ChevronDownIcon className="text-muted-foreground pointer-events-none absolute top-2.5 right-2.5 size-4" />
    </div>
  );
}
