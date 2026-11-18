import { cn } from "@/lib/utils";

/**
 * Carbon's data table: plain rows split by hairlines, medium-weight headers,
 * whole-row hover. `TableCard` frames it when it sits inside page content.
 */
export function TableCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("bg-surface overflow-hidden rounded-xl border dark:border-transparent dark:shadow-surface", className)}
      {...props}
    />
  );
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("[&_tr]:border-b [&_tr:hover]:bg-transparent", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("hover:bg-muted/60 data-[state=selected]:bg-muted border-b transition-colors", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "text-foreground/80 h-11 px-4 py-3 text-left align-middle text-sm font-medium whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("text-foreground/80 h-11 px-4 py-2 align-middle text-sm whitespace-nowrap", className)}
      {...props}
    />
  );
}
