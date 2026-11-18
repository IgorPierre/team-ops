"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TaskDrawer } from "@/components/board/task-drawer";
import { PageBody, PageHeader, SectionHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useBlockers } from "@/hooks/use-blockers";
import { useMemberDirectory } from "@/hooks/use-member-directory";
import { useT } from "@/lib/i18n";
import { useWorkspace } from "@/providers/workspace-provider";

export default function BlockersPage() {
  const t = useT();
  const { members } = useWorkspace();
  const directory = useMemberDirectory(members);
  const blockers = useBlockers();
  const queryClient = useQueryClient();
  const [taskId, setTaskId] = useState<string | null>(null);
  const task = blockers.data?.find((item) => item.id === taskId) ?? null;

  return <>
    <PageHeader title={t("Pending items")} />
    <PageBody>
      <SectionHeader title={t("Pending items")} count={blockers.data?.length}
        description={t("Blocked tasks and what members need to continue.")} />
      {blockers.isPending ? <p aria-busy="true">{t("Loading…")}</p> : blockers.isError ? (
        <EmptyState title={t("Could not load pending items")} tone="error"
          action={<Button onClick={() => void blockers.refetch()}>{t("Try again")}</Button>} />
      ) : blockers.data.length === 0 ? <EmptyState title={t("No pending blockers")} /> : (
        <ul className="divide-y rounded-lg border">
          {blockers.data.map((item) => <li key={item.id}>
            <button className="hover:bg-muted flex w-full flex-col gap-2 p-4 text-left focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() => setTaskId(item.id)}>
              <span className="text-muted-foreground text-xs">{item.key} · {item.projectName}</span>
              <span className="font-medium">{item.title}</span>
              <span className="whitespace-pre-wrap break-words text-sm text-destructive">{item.blockedReason}</span>
              <span className="text-muted-foreground text-xs">{t("Assignee")}: {directory.get(item.assigneeId)?.name ?? t("Unassigned")}</span>
            </button>
          </li>)}
        </ul>
      )}
    </PageBody>
    <TaskDrawer task={task} members={members} open={Boolean(task)}
      onOpenChange={(open) => { if (!open) setTaskId(null); }}
      onUpdated={() => void queryClient.invalidateQueries({ queryKey: ["tasks"] })} />
  </>;
}
