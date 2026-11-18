"use client";

import { isTaskComplete } from "@team-ops/api-client";

import type { Task } from "@team-ops/api-client";
import {
  BotIcon,
  CalendarClockIcon,
  FolderIcon,
  MessageSquareIcon,
  OctagonAlertIcon,
  SquareUserIcon,
} from "lucide-react";
import type { ComponentProps } from "react";

import { KanbanItem, KanbanItemHandle } from "@/components/reui/kanban";
import { ProofLink } from "./proof-link";
import { UserAvatar } from "@/components/ui/avatar";
import { Status } from "@/components/ui/badge";
import { BarProgress } from "@/components/ui/bar-progress";
import { checklistProgress, stripChecklist } from "@/lib/checklist";
import { useT } from "@/lib/i18n";
import { PRIORITY_DISPLAY } from "@/lib/task-display";
import { cn, formatDueRelative, isOverdue } from "@/lib/utils";

interface TaskCardProps extends Omit<ComponentProps<typeof KanbanItem>, "value" | "children"> {
  task: Task;
  assigneeName?: string;
  showProject?: boolean;
  asHandle?: boolean;
  isOverlay?: boolean;
  onOpen?: (task: Task) => void;
}

function Row({ icon, children, className }: { icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2 text-sm", className)}>
      <span className="text-muted-foreground flex shrink-0 [&_svg]:size-4">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

/** Carbon schedule card: header with id + title, icon rows, footer with people and counts. */
export function TaskCard({ task, assigneeName, showProject, asHandle, isOverlay, onOpen, ...props }: TaskCardProps) {
  const t = useT();
  const due = formatDueRelative(task.dueDate, task.status);
  const overdue = isOverdue(task.dueDate, task.status);
  const priority = PRIORITY_DISPLAY[task.priority];
  const description = stripChecklist(task.description);
  const checklist = checklistProgress(task.description, task.acceptanceCriteria);

  const card = (
    <article
      className={cn(
        "group/card bg-surface hover:bg-muted/30 dark:hover:bg-accent flex cursor-pointer flex-col rounded-xl border text-left transition-colors",
        "dark:shadow-surface dark:border-transparent",
        task.blocked && "border-2 border-red-500 dark:border-red-500",
        isOverlay && "ring-primary rotate-1 shadow-lg ring-2",
      )}
      onClick={() => onOpen?.(task)}
    >
      <header className="flex items-start justify-between gap-2 px-4 pt-3.5 pb-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-muted-foreground line-clamp-1 text-xs">{task.key}</span>
          <h3 className="line-clamp-2 text-sm leading-tight font-semibold">{task.title}</h3>
        </div>
        <div className="text-muted-foreground flex shrink-0 items-center gap-1.5 pt-0.5">
          {task.blocked ? <OctagonAlertIcon className="size-4 text-red-500" aria-label={t("Blocked")} /> : null}
          {task.source === "ai" ? <BotIcon className="size-4" aria-label={t("Opened by a coding agent")} /> : null}
        </div>
      </header>

      <div className="flex flex-col gap-2 border-t px-4 py-3">
        {description ? <p className="text-muted-foreground line-clamp-2 text-sm">{description}</p> : null}
        {showProject ? <Row icon={<FolderIcon />}>{task.projectName}</Row> : null}
        <Row icon={<SquareUserIcon />}>
          {assigneeName ?? <span className="text-muted-foreground">{t("Unassigned")}</span>}
        </Row>
        {due ? (
          <Row icon={<CalendarClockIcon />} className={cn(overdue && "text-red-500 [&_svg]:!text-red-500")}>
            {due}
          </Row>
        ) : null}
        {isTaskComplete(task.status) && task.proof ? <ProofLink proof={task.proof} /> : null}
        {checklist.total > 0 ? (
          <BarProgress
            className="pt-1"
            label={t("Checklist")}
            value={`${checklist.done}/${checklist.total}`}
            progress={checklist.done}
            max={checklist.total}
          />
        ) : null}
      </div>

      {task.blockedReason && task.blocked ? <p className="px-4 pb-3 text-xs text-destructive whitespace-pre-wrap break-words">{task.blockedReason}</p> : null}

      <footer className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-xs">
        {!isTaskComplete(task.status) ? (
          <Status color={priority.color}>{t(priority.label)}</Status>
        ) : (
          <Status color="green">{t(task.status === "production" ? "Production" : "Done")}</Status>
        )}
        <div className="text-muted-foreground flex items-center gap-3">
          {task.commentCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquareIcon className="size-3.5" />
              {task.commentCount}
            </span>
          ) : null}
          {assigneeName ? <UserAvatar name={assigneeName} size="xs" /> : null}
        </div>
      </footer>
    </article>
  );

  return (
    <KanbanItem value={task.id} {...props}>
      {asHandle && !isOverlay ? <KanbanItemHandle>{card}</KanbanItemHandle> : card}
    </KanbanItem>
  );
}
