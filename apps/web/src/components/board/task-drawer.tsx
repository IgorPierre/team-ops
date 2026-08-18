"use client";

import type { Member, Task } from "@team-ops/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Textarea } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { formatDue } from "@/lib/utils";
import { TeamOpsError } from "@team-ops/api-client";

import { ActivityTimeline } from "./activity-timeline";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

interface TaskDrawerProps {
  task: Task | null;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (task: Task) => void;
}

export function TaskDrawer({ task, members, open, onOpenChange, onUpdated }: TaskDrawerProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [criteria, setCriteria] = useState(task?.acceptanceCriteria ?? "");

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description);
    setCriteria(task.acceptanceCriteria);
  }, [task]);

  const comments = useQuery({
    queryKey: ["comments", task?.id],
    queryFn: () => api.listComments(task!.id),
    enabled: Boolean(task),
  });
  const activities = useQuery({
    queryKey: ["activities", task?.id],
    queryFn: () => api.listActivities(task!.id),
    enabled: Boolean(task),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!task) return;
      return api.updateTask(task.id, {
        title,
        description,
        acceptanceCriteria: criteria,
        expectedVersion: task.version,
      });
    },
    onSuccess: (updated) => {
      if (updated) onUpdated(updated);
      toast.success("Task saved");
    },
    onError: (error) =>
      toast.error(error instanceof TeamOpsError ? error.message : "Could not save task"),
  });

  const archive = useMutation({
    mutationFn: async () => {
      if (!task) return;
      await api.archiveTask(task.id, { expectedVersion: task.version });
    },
    onSuccess: () => {
      toast.success("Task archived");
      onOpenChange(false);
    },
  });

  if (!task) return null;

  const assignee = members.find((m) => m.userId === task.assigneeId);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next && task) {
          setTitle(task.title);
          setDescription(task.description);
          setCriteria(task.acceptanceCriteria);
        }
        onOpenChange(next);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <p className="text-muted-foreground font-mono text-xs">{task.key}</p>
          <SheetTitle>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" />
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pb-8">
          <section className="grid grid-cols-2 gap-3 text-sm">
            <Meta label="Organization" value={task.organizationId.slice(0, 8)} />
            <Meta label="Project" value={`${task.projectKey} · ${task.projectName}`} />
            <Meta label="Status" value={task.status.replace("_", " ")} />
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Priority</p>
              <Badge
                variant={
                  task.priority === "high"
                    ? "destructive-outline"
                    : task.priority === "medium"
                      ? "primary-outline"
                      : "warning-outline"
                }
              >
                {task.priority}
              </Badge>
            </div>
            <Meta label="Assignee" value={assignee?.name ?? "Unassigned"} />
            <Meta label="Due" value={formatDue(task.dueDate) ?? "—"} />
            <Meta label="Source" value={task.source} />
            <Meta label="External ref" value={task.externalRef ?? "—"} />
            <Meta label="Created" value={new Date(task.createdAt).toLocaleString()} />
            <Meta label="Updated" value={new Date(task.updatedAt).toLocaleString()} />
          </section>
          {task.blocked ? (
            <p className="text-destructive text-sm">Blocked: {task.blockedReason}</p>
          ) : null}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Acceptance criteria</Label>
            <Textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              Save
            </Button>
            <Button variant="outline" onClick={() => archive.mutate()}>
              Archive
            </Button>
          </div>
          <CommentList comments={comments.data ?? []} members={members} />
          <CommentForm
            taskId={task.id}
            onCreated={() => {
              void comments.refetch();
              void activities.refetch();
            }}
          />
          <ActivityTimeline activities={activities.data ?? []} members={members} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}
