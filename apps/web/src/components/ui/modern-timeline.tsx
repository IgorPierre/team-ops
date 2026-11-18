"use client";

import { motion, useReducedMotion } from "framer-motion";

import { BarProgress } from "./bar-progress";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { UserAvatar } from "./avatar";
import { Badge, type BadgeColor } from "./badge";
import { EmptyState } from "./empty-state";

export type TimelineStatus = "completed" | "current" | "upcoming";

export interface TimelineItem {
  /** Stable key. Falls back to the index. */
  id?: string;
  title: string;
  description: string;
  /** Machine-readable date for <time dateTime>. */
  date?: string;
  /** Human label for the date. Defaults to `date`. */
  dateLabel?: string;
  image?: string | null;
  /** Name behind the avatar; initials are derived from it. */
  avatarLabel?: string;
  status?: TimelineStatus;
  /** Badge text. Defaults to the capitalised status. */
  statusLabel?: string;
  /** Badge colour. Defaults by status. */
  statusColor?: BadgeColor;
  /** 0–100. */
  progress?: number;
  category?: string;
  /** Extra chips under the description (priority, assignee…). */
  meta?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  emptyMessage?: string;
  onSelect?: (item: TimelineItem, index: number) => void;
}

const STATUS_STYLE: Record<TimelineStatus, { color: BadgeColor; bar: string }> = {
  completed: { color: "success", bar: "bg-theme" },
  current: { color: "blue", bar: "bg-theme" },
  upcoming: { color: "gray", bar: "bg-input" },
};

/** Vertical feed of cards, each showing its owner's avatar. */
export function Timeline({ items, className, emptyMessage, onSelect }: TimelineProps) {
  const reduce = useReducedMotion();
  const t = useT();

  if (items.length === 0) {
    return <EmptyState className={className} title={emptyMessage ?? t("Nothing to show yet.")} />;
  }

  return (
    <ol
      className={cn("grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", className)}
      aria-label={t("Timeline")}
    >
      {items.map((item, index) => {
        const status = item.status ?? "upcoming";
        const style = STATUS_STYLE[status];
        const label = item.statusLabel ?? t(status.charAt(0).toUpperCase() + status.slice(1));

        return (
          <motion.li
            key={item.id ?? index}
            className="flex min-w-0"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            // Stagger per screenful, not per list position.
            transition={{
              duration: 0.25,
              delay: (index % 8) * 0.03,
              ease: "easeOut",
            }}
          >
            <article
              className={cn(
                "bg-surface flex min-w-0 flex-1 flex-col rounded-xl border p-4 transition-colors dark:border-transparent dark:shadow-surface",
                onSelect && "hover:bg-muted/30 dark:hover:bg-accent cursor-pointer",
              )}
              onClick={onSelect ? () => onSelect(item, index) : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="shrink-0" title={item.avatarLabel}>
                    <UserAvatar name={item.avatarLabel ?? "?"} src={item.image} size="sm" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-foreground text-sm font-semibold">
                      {onSelect ? (
                        <button
                          type="button"
                          className="focus-visible:ring-ring/20 rounded-sm text-left hover:underline focus-visible:ring-4 focus-visible:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(item, index);
                          }}
                        >
                          {item.title}
                        </button>
                      ) : (
                        item.title
                      )}
                    </h3>
                    <p className="text-subtle-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                      {item.category ? <span className="font-medium">{item.category}</span> : null}
                      {item.category && item.date ? <span aria-hidden="true">·</span> : null}
                      {item.date ? <time dateTime={item.date}>{item.dateLabel ?? item.date}</time> : null}
                    </p>
                  </div>
                </div>
                <Badge color={item.statusColor ?? style.color} dot>
                  {label}
                </Badge>
              </div>

              {item.description ? (
                <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">{item.description}</p>
              ) : null}

              {item.meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{item.meta}</div> : null}

              {item.progress !== undefined ? (
                <BarProgress
                  className="mt-auto pt-4"
                  progress={item.progress}
                  activeClassName={style.bar}
                  aria-label={t("Progress for {title}", { title: item.title })}
                />
              ) : null}
            </article>
          </motion.li>
        );
      })}
    </ol>
  );
}
