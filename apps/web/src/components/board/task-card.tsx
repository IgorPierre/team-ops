"use client";

import type { Task } from "@team-ops/api-client";
import { BotIcon, MessageSquareIcon, OctagonAlertIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Badge } from "@/components/reui/badge";
import { KanbanItem, KanbanItemHandle } from "@/components/reui/kanban";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDue, initials } from "@/lib/utils";

interface TaskCardProps extends Omit<ComponentProps<typeof KanbanItem>, "value" | "children"> {
  task: Task;
  assigneeName?: string;
  showProject?: boolean;
  asHandle?: boolean;
  isOverlay?: boolean;
  onOpen?: (task: Task) => void;
}

export function TaskCard({
  task,
  assigneeName,
  showProject,
  asHandle,
  isOverlay,
  onOpen,
  ...props
}: TaskCardProps) {
  const cardContent = (
    <Card
      className={cn(
        "hover:border-primary/40 cursor-pointer transition-colors",
        task.blocked && "border-destructive/40",
      )}
      onClick={() => onOpen?.(task)}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-mono text-[11px]">{task.key}</span>
          <div className="flex items-center gap-1">
            {task.source === "ai" ? (
              <span className="text-muted-foreground inline-flex items-center gap-0.5 text-[10px] tracking-wide uppercase">
                <BotIcon className="size-3" />
                AI
              </span>
            ) : null}
            {task.blocked ? <OctagonAlertIcon className="text-destructive size-3.5" /> : null}
          </div>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 text-sm font-medium">{task.title}</span>
          <Badge
            variant={
              task.priority === "high"
                ? "destructive-outline"
                : task.priority === "medium"
                  ? "primary-outline"
                  : "warning-outline"
            }
            className="pointer-events-none h-5 shrink-0"
          >
            {task.priority}
          </Badge>
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <div className="flex min-w-0 items-center gap-2">
            {showProject ? <span className="truncate">{task.projectKey}</span> : null}
            {assigneeName ? (
              <div className="flex items-center gap-1">
                <Avatar className="size-4">
                  <AvatarFallback>{initials(assigneeName)}</AvatarFallback>
                </Avatar>
                <span className="line-clamp-1">{assigneeName}</span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {task.commentCount > 0 ? (
              <span className="inline-flex items-center gap-0.5">
                <MessageSquareIcon className="size-3" />
                {task.commentCount}
              </span>
            ) : null}
            {task.dueDate ? (
              <time className="text-[10px] whitespace-nowrap tabular-nums">
                {formatDue(task.dueDate)}
              </time>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <KanbanItem value={task.id} {...props}>
      {asHandle && !isOverlay ? <KanbanItemHandle>{cardContent}</KanbanItemHandle> : cardContent}
    </KanbanItem>
  );
}
