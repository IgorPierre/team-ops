"use client";

import type { Member, Task } from "@team-ops/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, BotIcon, OctagonAlertIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/ui/avatar";
import { Badge, Status } from "@/components/ui/badge";
import { BarProgress } from "@/components/ui/bar-progress";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SegmentedTabs } from "@/components/ui/tabs";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useMemberDirectory } from "@/hooks/use-member-directory";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { checklistProgress } from "@/lib/checklist";
import { useT } from "@/lib/i18n";
import { PRIORITY_DISPLAY, STATUS_DISPLAY } from "@/lib/task-display";
import { cn, formatDateTime, formatDue, isOverdue } from "@/lib/utils";

import { ActivityTimeline } from "./activity-timeline";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import { ProofLink } from "./proof-link";

interface TaskDrawerProps {
  task: Task | null;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (task: Task) => void;
}

type Draft = Pick<Task, "title" | "description" | "acceptanceCriteria">;

const draftOf = (task: Task | null): Draft => ({
  title: task?.title ?? "",
  description: task?.description ?? "",
  acceptanceCriteria: task?.acceptanceCriteria ?? "",
});

export function TaskDrawer({ task, members, open, onOpenChange, onUpdated }: TaskDrawerProps) {
  const t = useT();
  const queryClient = useQueryClient();
  const directory = useMemberDirectory(members);
  const [draft, setDraft] = useState<Draft>(() => draftOf(task));
  const [tab, setTab] = useState<"comments" | "activity">("comments");

  // Reset the form whenever another task (or a newer version of it) is shown.
  useEffect(() => setDraft(draftOf(task)), [task]);

  const comments = useQuery({
    queryKey: ["comments", task?.id],
    queryFn: () => api.listComments(task!.id),
    enabled: Boolean(task) && open,
  });
  const activities = useQuery({
    queryKey: ["activities", task?.id],
    queryFn: () => api.listActivities(task!.id),
    enabled: Boolean(task) && open,
  });

  const save = useMutation({
    mutationFn: (current: Task) => api.updateTask(current.id, { ...draft, expectedVersion: current.version }),
    onSuccess: (updated) => {
      onUpdated(updated);
      toast.success(t("Task saved"));
    },
    onError: (error) => toast.error(errorMessage(error, t("Could not save task"))),
  });

  const archive = useMutation({
    mutationFn: (current: Task) => api.archiveTask(current.id, { expectedVersion: current.version }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["timeline-tasks"] });
      toast.success(t("Task archived"));
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMessage(error, t("Could not archive task"))),
  });

  if (!task) return null;

  const assignee = directory.get(task.assigneeId);
  const dirty =
    draft.title !== task.title ||
    draft.description !== task.description ||
    draft.acceptanceCriteria !== task.acceptanceCriteria;
  const status = STATUS_DISPLAY[task.status];
  const priority = PRIORITY_DISPLAY[task.priority];
  // Follows the draft, so ticking a box in the text updates the bar at once.
  const checklist = checklistProgress(draft.description, draft.acceptanceCriteria);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader>
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            {task.key}
            <span aria-hidden="true">·</span>
            <span className="font-sans">{task.projectName}</span>
          </div>
          <SheetTitle asChild>
            <input
              aria-label={t("Title")}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="text-foreground/90 -mx-1.5 rounded-md px-1.5 py-0.5 text-base font-medium tracking-tight outline-none hover:bg-primary/5 focus-visible:bg-primary/5"
            />
          </SheetTitle>
          <SheetDescription className="sr-only">{t("Task details, comments and activity")}</SheetDescription>
        </SheetHeader>

        <SheetBody>
          {task.blocked ? (
            <div className="flex gap-3 rounded-lg bg-rose-50 p-3 text-sm text-[#c2410c] dark:bg-red-500/15 dark:text-red-400">
              <OctagonAlertIcon className="mt-0.5 size-4 shrink-0" />
              <p>
                <span className="font-semibold">{t("Blocked.")}</span> {task.blockedReason}
              </p>
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Property label={t("Status")}>
              <Status color={status.color}>{t(status.label)}</Status>
            </Property>
            <Property label={t("Priority")}>
              <Status color={priority.color}>{t(priority.label)}</Status>
            </Property>
            <Property label={t("Assignee")}>
              {assignee ? (
                <span className="flex items-center gap-2">
                  <UserAvatar name={assignee.name} src={assignee.avatarUrl} size="xs" />
                  {assignee.name}
                </span>
              ) : (
                <span className="text-muted-foreground">{t("Unassigned")}</span>
              )}
            </Property>
            <Property label={t("Due date")}>
              <span className={cn(isOverdue(task.dueDate, task.status) && "text-destructive font-medium")}>
                {formatDue(task.dueDate) ?? "—"}
              </span>
            </Property>
            <Property label={t("Source")}>
              {task.source === "ai" ? (
                <Badge color="purple">
                  <BotIcon />
                  {t("Coding agent")}
                </Badge>
              ) : (
                t("Manual")
              )}
            </Property>
            {task.externalRef ? (
              <Property label={t("External ref")}>
                <span className="font-mono text-xs">{task.externalRef}</span>
              </Property>
            ) : null}
            {task.proof ? (
              <Property label={t("Proof")}>
                <ProofLink proof={task.proof} />
              </Property>
            ) : null}
            <Property label={t("Created")}>{formatDateTime(task.createdAt)}</Property>
            <Property label={t("Updated")}>{formatDateTime(task.updatedAt)}</Property>
          </dl>

          {checklist.total > 0 ? (
            <BarProgress
              label={t("Checklist")}
              value={`${checklist.done}/${checklist.total}`}
              progress={checklist.done}
              max={checklist.total}
            />
          ) : null}

          <Field label={t("Description")} htmlFor="task-description">
            <Textarea
              id="task-description"
              placeholder={t("Add a description…")}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </Field>
          <Field label={t("Acceptance criteria")} htmlFor="task-criteria">
            <Textarea
              id="task-criteria"
              placeholder={t("What has to be true for this to be done?\n- [ ] One check per line")}
              value={draft.acceptanceCriteria}
              onChange={(e) => setDraft({ ...draft, acceptanceCriteria: e.target.value })}
            />
          </Field>

          <section className="flex flex-col gap-4 border-t pt-5">
            <SegmentedTabs
              label={t("Task feed")}
              value={tab}
              onChange={setTab}
              options={[
                { value: "comments", label: t("Comments"), count: comments.data?.length },
                { value: "activity", label: t("Activity") },
              ]}
            />
            {tab === "comments" ? (
              <>
                <CommentList comments={comments.data ?? []} members={directory.byId} />
                <CommentForm
                  taskId={task.id}
                  onCreated={() => {
                    void comments.refetch();
                    void activities.refetch();
                  }}
                />
              </>
            ) : (
              <ActivityTimeline activities={activities.data ?? []} members={directory.byId} />
            )}
          </section>
        </SheetBody>

        <SheetFooter className="flex-col items-stretch sm:flex-row sm:items-center sm:justify-between">
          <Button variant="destructive-secondary" onClick={() => archive.mutate(task)} disabled={archive.isPending}>
            <ArchiveIcon />
            {t("Archive")}
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" disabled={!dirty} onClick={() => setDraft(draftOf(task))}>
              {t("Discard")}
            </Button>
            <Button onClick={() => save.mutate(task)} disabled={!dirty || !draft.title.trim() || save.isPending}>
              {save.isPending ? t("Saving…") : t("Save changes")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="text-foreground flex min-h-6 min-w-0 items-center truncate text-sm font-medium">{children}</dd>
    </div>
  );
}
