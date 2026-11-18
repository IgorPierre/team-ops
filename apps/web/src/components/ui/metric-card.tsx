import { cn } from "@/lib/utils";

const TONES = {
  default: "text-foreground",
  brand: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
} as const;

/** One headline number with a label and a short explanation (Carbon KPI tile). */
export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface flex flex-col gap-1 rounded-xl border px-5 py-4 dark:border-transparent dark:shadow-surface",
        className,
      )}
    >
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className={cn("text-[28px] leading-tight font-medium tracking-tight tabular-nums", TONES[tone])}>{value}</p>
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

export function MetricGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)} {...props} />;
}
