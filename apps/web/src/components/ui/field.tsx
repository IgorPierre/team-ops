import { cn } from "@/lib/utils";

import { Label } from "./label";

/**
 * Label + control + hint/error, stacked. Pass the control's id as `htmlFor`
 * so the label and the messages are wired to it.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

/** Inline error for a whole form (e.g. a failed request). */
export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="bg-rose-50 text-[#c2410c] dark:bg-red-500/15 dark:text-red-400 rounded-lg px-3 py-2 text-sm font-medium"
    >
      {children}
    </p>
  );
}
