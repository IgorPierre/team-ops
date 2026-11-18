"use client";

import type { Priority } from "@team-ops/api-client";
import { useMutation } from "@tanstack/react-query";
import { SquarePenIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n";
import { PRIORITIES, PRIORITY_DISPLAY } from "@/lib/task-display";
import { useWorkspace } from "@/providers/workspace-provider";

/** "New task" modal. Defaults to the project the board is filtered on. */
export function TaskForm({
  open,
  onOpenChange,
  defaultProjectId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  onCreated: () => void;
}) {
  const t = useT();
  const { orgId, projects, members } = useWorkspace();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assigneeId, setAssigneeId] = useState("");

  useEffect(() => {
    if (open) setProjectId(defaultProjectId || projects[0]?.id || "");
  }, [open, defaultProjectId, projects]);

  const mutation = useMutation({
    mutationFn: () =>
      api.createTask({
        organizationId: orgId!,
        projectId,
        title,
        description,
        priority,
        assigneeId: assigneeId || undefined,
      }),
    onSuccess: () => {
      toast.success(t("Task created"));
      setTitle("");
      setDescription("");
      setAssigneeId("");
      onCreated();
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMessage(error, t("Could not create task"))),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <DialogHeader
            icon={<SquarePenIcon />}
            title={t("New task")}
            description={t("Add a card to the backlog. Agents and teammates pick it up from there.")}
          />
          <DialogBody>
            <Field label={t("Title")} htmlFor="task-title">
              <Input
                id="task-title"
                placeholder={t("What needs to be done?")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field label={t("Description")} htmlFor="task-description-new">
              <Textarea
                id="task-description-new"
                placeholder={t("Context, links, constraints…")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Field label={t("Project")} htmlFor="task-project">
              <Select id="task-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.key} · {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Priority")} htmlFor="task-priority">
                <Select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {t(PRIORITY_DISPLAY[p].label)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("Assignee")} htmlFor="task-assignee">
                <Select id="task-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                  <option value="">{t("Unassigned")}</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="md">
                {t("Cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" size="md" disabled={!title.trim() || !projectId || mutation.isPending}>
              {mutation.isPending ? t("Creating…") : t("Create task")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
