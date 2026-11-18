"use client";

import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

import {
  BoardToolbar,
  type BoardFilterState,
} from "@/components/board/board-toolbar";
import { ProjectKanban } from "@/components/board/project-kanban";
import { TaskForm } from "@/components/board/task-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQueryParams } from "@/hooks/use-query-params";
import { useT } from "@/lib/i18n";
import { useWorkspace } from "@/providers/workspace-provider";

export default function BoardPage() {
  return (
    <Suspense fallback={null}>
      <Board />
    </Suspense>
  );
}

function Board() {
  const t = useT();
  const queryClient = useQueryClient();
  const { orgId, projects, members, canWrite } = useWorkspace();
  const query = useQueryParams();
  const [formOpen, setFormOpen] = useState(false);

  // Search is typed locally and mirrored to the URL once the user pauses.
  const [search, setSearch] = useState(query.get("q"));
  const debouncedSearch = useDebouncedValue(search);
  const { get: getParam, set: setParams } = query;
  useEffect(() => {
    if (debouncedSearch !== getParam("q")) setParams({ q: debouncedSearch });
  }, [debouncedSearch, getParam, setParams]);

  const filters: BoardFilterState = {
    project: query.get("project"),
    priority: query.get("priority"),
    assignee: query.get("assignee"),
    search,
  };

  function updateFilters(patch: Partial<BoardFilterState>) {
    const { search: nextSearch, ...rest } = patch;
    if (nextSearch !== undefined) setSearch(nextSearch);
    if (Object.keys(rest).length) setParams(rest as Record<string, string>);
  }

  const project = projects.find((p) => p.id === filters.project);

  return (
    <>
      <PageHeader
        title={project ? project.name : t("Board")}
        actions={
          canWrite ? (
            <Button size="md" onClick={() => setFormOpen(true)}>
              <PlusIcon />
              {t("New task")}
            </Button>
          ) : null
        }
      />
      <BoardToolbar value={filters} onChange={updateFilters} />
      {orgId ? (
        <ProjectKanban
          organizationId={orgId}
          projectId={filters.project || undefined}
          search={debouncedSearch}
          priority={filters.priority}
          assigneeId={filters.assignee}
          members={members}
        />
      ) : null}
      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultProjectId={filters.project || undefined}
        onCreated={() =>
          void queryClient.invalidateQueries({ queryKey: ["tasks"] })
        }
      />
    </>
  );
}
