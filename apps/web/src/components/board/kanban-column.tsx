"use client";

import type { Task } from "@team-ops/api-client";
import type { ComponentProps } from "react";

import { KanbanColumn, KanbanColumnContent } from "@/components/reui/kanban";
import { COLUMN_TITLES, type ColumnId } from "@/lib/board";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { TaskCard } from "./task-card";

/** Status dot colours, matching the Status badges. */
const DOT: Record<ColumnId, string> = {
  backlog: "bg-zinc-400",
  in_progress: "bg-[#008AF5]",
  review: "bg-yellow-500",
  done: "bg-emerald-500",
};

interface KanbanColumnViewProps extends Omit<ComponentProps<typeof KanbanColumn>, "children"> {
  value: ColumnId;
  tasks: Task[];
  names: Record<string, string>;
  showProject: boolean;
  onOpen?: (task: Task) => void;
}

/**
 * Carbon's schedule column: 350px, flush against its neighbours with a
 * hairline between them, a sticky header and a scrolling card list.
 */
export function KanbanColumnView({ value, tasks, names, showProject, onOpen, ...props }: KanbanColumnViewProps) {
  const t = useT();
  return (
    <KanbanColumn
      value={value}
      disabled
      className="bg-muted/40 dark:bg-transparent flex h-full min-h-0 w-[350px] max-w-[85vw] shrink-0 snap-center flex-col border-r"
      {...props}
    >
      <div className="bg-card sticky top-0 z-[1] flex items-center gap-2.5 border-b p-4">
        <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
          {value === "in_progress" && tasks.length > 0 ? (
            <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", DOT[value])} />
          ) : null}
          <span className={cn("relative inline-flex size-2.5 rounded-full", DOT[value])} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{t(COLUMN_TITLES[value])}</span>
          <span className="text-muted-foreground text-xs">
            {tasks.length === 1 ? t("1 task") : t("{n} tasks", { n: tasks.length })}
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <KanbanColumnContent value={value} className="flex min-h-24 flex-col gap-2 p-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assigneeName={task.assigneeId ? names[task.assigneeId] : undefined}
              showProject={showProject}
              asHandle
              onOpen={onOpen}
            />
          ))}
          {tasks.length === 0 ? (
            <div className="text-muted-foreground flex items-center justify-center rounded-md border border-dashed py-8 text-xs">
              {t("No tasks")}
            </div>
          ) : null}
        </KanbanColumnContent>
      </div>
    </KanbanColumn>
  );
}
