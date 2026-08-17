"use client";

import type { Task } from "@team-ops/api-client";
import type { ComponentProps } from "react";

import { Badge } from "@/components/reui/badge";
import { KanbanColumn, KanbanColumnContent } from "@/components/reui/kanban";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { COLUMN_TITLES, type ColumnId } from "@/lib/board";

import { TaskCard } from "./task-card";

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
  return (
    <KanbanColumn value={value} disabled {...props}>
      <Card className="flex h-full flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{COLUMN_TITLES[value]}</span>
            <Badge variant="outline">{tasks.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-y-auto">
          <KanbanColumnContent value={value} className="flex min-h-24 flex-col gap-2.5 p-0.5">
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
        </CardContent>
      </Card>
    </KanbanColumn>
  );
}
