import { cn } from "@/lib/utils";

/**
 * Carbon's card: a grey shell (`bg-accent`) holding a header, with the
 * content in a white panel inset on top of it. In dark mode the shell is the
 * card colour and the panel a faint lift.
 */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-accent text-card-foreground dark:bg-card relative flex w-full min-w-0 flex-col rounded-xl border",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-muted-foreground flex flex-col gap-1 px-6 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-foreground/90 text-base leading-none font-medium tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-muted-foreground text-xs tracking-tight", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card dark:bg-muted/40 m-[-1px] flex min-w-0 flex-1 flex-col rounded-xl border p-6 max-md:p-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2 px-6 py-4", className)} {...props} />;
}

/**
 * Card with a title bar. Use for page sections that group related content
 * (a chart, a table, a settings block).
 */
export function Panel({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader className="min-h-16 flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent className={bodyClassName}>{children}</CardContent>
    </Card>
  );
}
