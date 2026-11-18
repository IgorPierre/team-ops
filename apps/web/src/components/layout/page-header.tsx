"use client";

import { cn } from "@/lib/utils";

import { PageActions } from "./page-actions";

/**
 * The breadcrumbs already name the page, so the title is only for screen
 * readers; actions go to the topbar.
 */
export function PageHeader({
  title,
  actions,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <>
      <h1 className="sr-only">{title}</h1>
      {actions ? <PageActions>{actions}</PageActions> : null}
    </>
  );
}

/** Horizontal page padding + vertical rhythm for the content under the header. */
export function PageBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-6 px-4 pt-5 pb-10 md:px-6", className)}
      {...props}
    />
  );
}

/**
 * Title + count on the left, controls (search, filters, buttons) on the
 * right. Sits above a table or list.
 */
export function SectionHeader({
  title,
  count,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  count?: number;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-foreground flex items-center gap-2 text-base font-medium tracking-tight">
          {title}
          {count !== undefined ? (
            <span className="bg-secondary text-secondary-foreground rounded-lg px-2 text-xs leading-6 font-semibold tabular-nums dark:bg-muted">
              {count}
            </span>
          ) : null}
        </h2>
        {description ? (
          <p className="text-muted-foreground text-xs">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
