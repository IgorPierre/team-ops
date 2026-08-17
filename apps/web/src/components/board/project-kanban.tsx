"use client";

import type { Member, Task } from "@team-ops/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Kanban, KanbanBoard, KanbanOverlay } from "@/components/reui/kanban";
import { api } from "@/lib/api";
import {
  COLUMN_ORDER,
  applyTask,
  diffBoard,
  emptyBoard,
  groupTasks,
  type BoardColumns,
} from "@/lib/board";
import { TeamOpsError } from "@team-ops/api-client";

import { KanbanColumnView } from "./kanban-column";
import { TaskCard } from "./task-card";
import { TaskDrawer } from "./task-drawer";

interface ProjectKanbanProps {
  organizationId: string;
  projectId?: string;
  search?: string;
  priority?: string;
  assigneeId?: string;
  members: Member[];
}

export function ProjectKanban({
  organizationId,
  projectId,
  search,
  priority,
  assigneeId,
  members,
}: ProjectKanbanProps) {
  const queryClient = useQueryClient();
  const queryKey = ["tasks", organizationId, projectId, search, priority, assigneeId];
  const names = useMemo(
    () => Object.fromEntries(members.map((m) => [m.userId, m.name])),
    [members],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      api.listTasks({
        organizationId,
        projectId: projectId || undefined,
        search: search || undefined,
        priority: (priority as Task["priority"]) || undefined,
        assigneeId: assigneeId || undefined,
      }),
  });

  const [columns, setColumns] = useState<BoardColumns>(emptyBoard());
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (data) setColumns(groupTasks(data));
  }, [data]);

  const moveMutation = useMutation({
    mutationFn: async (change: {
      id: string;
      status: Task["status"];
      position: string;
      expectedVersion: number;
    }) => api.moveTask(change.id, change),
  });

  async function handleBoardChange(
    next: BoardColumns,
    previous: BoardColumns,
    movedId: string,
  ) {
    const changes = diffBoard(previous, next, movedId);
    if (changes.length === 0) return;
    try {
      const updated = await Promise.all(
        changes.map((change) =>
          moveMutation.mutateAsync({
            id: change.id,
            status: change.status,
            position: change.position,
            expectedVersion: change.expectedVersion,
          }),
        ),
      );
      queryClient.setQueryData<Task[]>(queryKey, (current) => {
        const list = current ? [...current] : [];
        for (const task of updated) {
          const index = list.findIndex((item) => item.id === task.id);
          if (index === -1) list.push(task);
          else list[index] = task;
        }
        return list;
      });
    } catch (error) {
      setColumns(previous);
      queryClient.setQueryData(queryKey, data);
      toast.error(
        error instanceof TeamOpsError ? error.message : "Could not move task. Restored the board.",
      );
    }
  }

  const showProject = !projectId;
  const openTask = data?.find((task) => task.id === openTaskId) ?? null;

  if (isLoading) {
    return (
      <div className="text-muted-foreground grid auto-cols-[320px] grid-flow-col gap-4 overflow-x-auto p-4 text-sm">
        {COLUMN_ORDER.map((id) => (
          <div key={id} className="bg-muted/40 h-[70vh] animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Kanban
        value={columns}
        onValueChange={(value) => setColumns(value as BoardColumns)}
        getItemValue={(item) => item.id}
        onValueCommit={(value, meta) =>
          void handleBoardChange(
            value as BoardColumns,
            meta.previousValue as BoardColumns,
            String(meta.itemId ?? ""),
          )
        }
      >
        <KanbanBoard className="grid h-full auto-cols-[320px] grid-flow-col gap-4 overflow-x-auto p-4">
          {COLUMN_ORDER.map((columnValue) => (
            <KanbanColumnView
              key={columnValue}
              value={columnValue}
              tasks={columns[columnValue]}
              names={names}
              showProject={showProject}
              onOpen={(task) => setOpenTaskId(task.id)}
            />
          ))}
        </KanbanBoard>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === "column") return null;
            const task = Object.values(columns)
              .flat()
              .find((item) => item.id === value);
            if (!task) return null;
            return (
              <TaskCard
                task={task}
                isOverlay
                showProject={showProject}
                assigneeName={task.assigneeId ? names[task.assigneeId] : undefined}
              />
            );
          }}
        </KanbanOverlay>
      </Kanban>
      <TaskDrawer
        task={openTask}
        members={members}
        open={Boolean(openTask)}
        onOpenChange={(open) => {
          if (!open) setOpenTaskId(null);
        }}
        onUpdated={(task) => {
          setColumns((current) => applyTask(current, task));
          queryClient.setQueryData<Task[]>(queryKey, (current) =>
            (current ?? []).map((item) => (item.id === task.id ? task : item)),
          );
        }}
      />
    </>
  );
}
