"use client";

import type { Task } from "@team-ops/api-client";
import { CircleCheckIcon, CircleDashedIcon, CircleDotIcon, ScanSearchIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { KanbanColumn, KanbanColumnContent } from "@/components/reui/kanban";
import { Badge } from "@/components/ui/badge";
import { COLUMN_TITLES, type ColumnId } from "@/lib/board";

import { TaskCard } from "./task-card";

const COLUMN_ICONS: Record<ColumnId, typeof CircleDashedIcon> = {
  backlog: CircleDashedIcon,
  in_progress: CircleDotIcon,
  review: ScanSearchIcon,
  done: CircleCheckIcon,
};

interface KanbanColumnViewProps extends Omit<ComponentProps<typeof KanbanColumn>, "children"> {
  value: ColumnId;
  tasks: Task[];
  names: Record<string, string>;
  showProject: boolean;
  isOverlay?: boolean;
  onOpen?: (task: Task) => void;
}

export function KanbanColumnView({
  value,
  tasks,
  names,
  showProject,
  isOverlay,
  onOpen,
  ...props
}: KanbanColumnViewProps) {
  const Icon = COLUMN_ICONS[value];
  return (
    <KanbanColumn value={value} disabled className="flex h-full min-h-0 min-w-[20rem] flex-col" {...props}>
      <div className="flex items-center gap-2 px-1 pb-3">
        <Icon className="text-muted-foreground size-4" />
        <h2 className="text-sm font-semibold">{COLUMN_TITLES[value]}</h2>
        <Badge variant="outline" className="rounded-full px-2">
          {tasks.length}
        </Badge>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <KanbanColumnContent value={value} className="flex min-h-24 flex-col gap-3 p-0.5 pb-6">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assigneeName={task.assigneeId ? names[task.assigneeId] : undefined}
              showProject={showProject}
              asHandle={!isOverlay}
              onOpen={onOpen}
            />
          ))}
        </KanbanColumnContent>
      </div>
    </KanbanColumn>
  );
}
