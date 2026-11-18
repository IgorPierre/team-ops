import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Centered message for empty lists, errors and "nothing selected" states. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "default" | "error";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      {Icon ? (
        <div
          className={cn(
            "mb-4 flex size-12 items-center justify-center rounded-full",
            tone === "error" ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </div>
      ) : null}
      <p className={cn("text-sm font-medium", tone === "error" ? "text-destructive" : "text-foreground")}>
        {title}
      </p>
      {description ? <p className="text-muted-foreground mt-1 max-w-sm text-xs">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
