"use client";

import type { Task } from "@team-ops/api-client";
import { BotIcon, MessageSquareIcon, MoreVerticalIcon, OctagonAlertIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { KanbanItem, KanbanItemHandle } from "@/components/reui/kanban";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDueRelative, initials } from "@/lib/utils";

interface TaskCardProps extends Omit<ComponentProps<typeof KanbanItem>, "value" | "children"> {
  task: Task;
  assigneeName?: string;
  showProject?: boolean;
  asHandle?: boolean;
  isOverlay?: boolean;
  onOpen?: (task: Task) => void;
}

function priorityVariant(task: Task) {
  if (task.status === "done") return "success" as const;
  if (task.priority === "high") return "high" as const;
  if (task.priority === "medium") return "medium" as const;
  return "low" as const;
}

function priorityLabel(task: Task) {
  if (task.status === "done") return "Completed";
  if (task.priority === "high") return "High Priority";
  if (task.priority === "medium") return "Medium Priority";
  return "Low Priority";
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
  const due = formatDueRelative(task.dueDate, task.status);
  const description = task.description?.trim();

  const cardContent = (
    <Card
      className={cn(
        "hover:border-foreground/10 cursor-pointer border-transparent shadow-sm transition-shadow hover:shadow-md",
        task.blocked && "border-destructive/40",
        isOverlay && "shadow-lg",
      )}
      onClick={() => onOpen?.(task)}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] leading-snug font-medium">{task.title}</h3>
          <Badge variant={priorityVariant(task)} className="pointer-events-none shrink-0">
            {priorityLabel(task)}
          </Badge>
        </div>
        {due ? <p className="text-muted-foreground text-xs">{due}</p> : null}
        {description ? (
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">{description}</p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {assigneeName ? (
              <Avatar className="size-7 border-2 border-card">
                <AvatarFallback>{initials(assigneeName)}</AvatarFallback>
              </Avatar>
            ) : null}
            {showProject ? (
              <span className="text-muted-foreground truncate font-mono text-[11px]">
                {task.projectKey}
              </span>
            ) : (
              <span className="text-muted-foreground truncate font-mono text-[11px]">{task.key}</span>
            )}
            {task.source === "ai" ? (
              <BotIcon className="text-muted-foreground size-3.5 shrink-0" aria-label="Created by agent" />
            ) : null}
            {task.blocked ? (
              <OctagonAlertIcon className="text-destructive size-3.5 shrink-0" aria-label="Blocked" />
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {task.commentCount > 0 ? (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <MessageSquareIcon className="size-3.5" />
                {task.commentCount}
              </span>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  aria-label="Task actions"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <MoreVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem onSelect={() => onOpen?.(task)}>Open</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
