"use client";

import type { Member, Task, TaskProof } from "@team-ops/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Kanban, KanbanBoard, KanbanOverlay } from "@/components/reui/kanban";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n";
import {
  COLUMN_ORDER,
  applyTask,
  diffBoard,
  emptyBoard,
  groupTasks,
  type BoardColumns,
} from "@/lib/board";

import { CompleteTaskDialog } from "./complete-task-dialog";
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
  const t = useT();
  const queryClient = useQueryClient();
  const queryKey = ["tasks", organizationId, projectId, search, priority, assigneeId];
  const names = useMemo(() => Object.fromEntries(members.map((m) => [m.userId, m.name])), [members]);

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
  // A card dropped on Done waits here until its proof is given (or the move is cancelled).
  const [completing, setCompleting] = useState<Task | null>(null);
  const proofResolver = useRef<((proof: TaskProof | null) => void) | null>(null);

  function askProof(task: Task) {
    return new Promise<TaskProof | null>((resolve) => {
      proofResolver.current = resolve;
      setCompleting(task);
    });
  }

  function settleProof(proof: TaskProof | null) {
    proofResolver.current?.(proof);
    proofResolver.current = null;
    setCompleting(null);
  }

  useEffect(() => {
    if (data) setColumns(groupTasks(data));
  }, [data]);

  const moveMutation = useMutation({
    mutationFn: async (change: {
      id: string;
      status: Task["status"];
      position: string;
      proof?: TaskProof;
      expectedVersion: number;
    }) =>
      api.moveTask(change.id, {
        status: change.status,
        position: change.position,
        proof: change.proof,
        expectedVersion: change.expectedVersion,
      }),
  });

  async function handleBoardChange(
    next: BoardColumns,
    previous: BoardColumns,
    movedId: string,
  ) {
    const changes = diffBoard(previous, next, movedId);
    if (changes.length === 0) return;
    // Moving a card into Done needs proof of the work.
    const moved = Object.values(previous)
      .flat()
      .find((task) => task.id === movedId);
    const movedChange = changes.find((change) => change.id === movedId);
    let proof: TaskProof | undefined;
    if (moved && movedChange?.status === "done" && moved.status !== "done") {
      const answer = await askProof(moved);
      if (!answer) {
        setColumns(previous);
        return;
      }
      proof = answer;
    }
    try {
      const updated = await Promise.all(
        changes.map((change) =>
          moveMutation.mutateAsync({
            id: change.id,
            status: change.status,
            position: change.position,
            proof: change.id === movedId ? proof : undefined,
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
      toast.error(errorMessage(error, t("Could not move task. Restored the board.")));
    }
  }

  const showProject = !projectId;
  const openTask = data?.find((task) => task.id === openTaskId) ?? null;

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 overflow-x-auto border-t" aria-busy="true">
        {COLUMN_ORDER.map((id) => (
          <div key={id} className="flex w-[350px] shrink-0 flex-col border-r">
            <div className="flex flex-col gap-1.5 border-b p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex flex-col gap-2 p-2">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <Kanban
        className="flex min-h-0 flex-1 flex-col"
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
        <KanbanBoard className="flex min-h-0 flex-1 snap-x overflow-x-auto border-t">
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
      <CompleteTaskDialog task={completing} onConfirm={settleProof} onCancel={() => settleProof(null)} />
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
