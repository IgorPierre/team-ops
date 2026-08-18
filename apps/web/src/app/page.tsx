"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuIcon, PlusIcon } from "lucide-react";

import { type BoardFilterState } from "@/components/board/board-filters";
import { ProjectKanban } from "@/components/board/project-kanban";
import { TaskForm } from "@/components/board/task-form";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TeamOpsError } from "@team-ops/api-client";

export default function BoardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState<string>();
  const [projectId, setProjectId] = useState("");
  const [filters, setFilters] = useState<BoardFilterState>({
    search: "",
    priority: "",
    assigneeId: "",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    retry: false,
  });
  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.listOrganizations(),
    enabled: me.isSuccess,
  });

  useEffect(() => {
    if (me.isError && me.error instanceof TeamOpsError && me.error.status === 401) {
      router.replace("/login");
    }
  }, [me.error, me.isError, router]);

  useEffect(() => {
    if (!orgId && orgs.data?.[0]) setOrgId(orgs.data[0].id);
  }, [orgId, orgs.data]);

  useEffect(() => {
    if (orgs.isSuccess && (orgs.data?.length ?? 0) === 0) {
      router.replace("/onboarding");
    }
  }, [orgs.data, orgs.isSuccess, router]);

  const projects = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => api.listProjects(orgId!),
    enabled: Boolean(orgId),
  });
  const members = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => api.listMembers(orgId!),
    enabled: Boolean(orgId),
  });

  function changeOrg(id: string) {
    setOrgId(id);
    setProjectId("");
    setFilters({ search: "", priority: "", assigneeId: "" });
  }

  if (!me.isSuccess) {
    return null;
  }

  const currentProject = projects.data?.find((project) => project.id === projectId);
  const heading = currentProject?.name ?? "All projects";
  const canCreate = orgs.data?.find((item) => item.id === orgId)?.role !== "viewer";

  return (
    <div className="bg-background flex h-svh overflow-x-clip">
      {mobileNav ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
        />
      ) : null}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 h-full transition-transform md:static md:translate-x-0",
          mobileNav ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <AppSidebar
          user={me.data}
          organizations={orgs.data ?? []}
          orgId={orgId}
          onOrgChange={changeOrg}
          projects={projects.data ?? []}
          projectId={projectId}
          onProjectChange={setProjectId}
          members={members.data ?? []}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 px-4 py-4 md:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNav(true)}
          >
            <MenuIcon />
          </Button>
          <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight">{heading}</h1>
          {canCreate ? (
            <Button size="sm" variant="ink" className="ml-auto" onClick={() => setFormOpen(true)}>
              <PlusIcon />
              Add Task
            </Button>
          ) : (
            <div className="ml-auto" />
          )}
        </header>
        <main className="min-h-0 flex-1">
          {orgId ? (
            <ProjectKanban
              organizationId={orgId}
              projectId={projectId || undefined}
              search={filters.search}
              priority={filters.priority}
              assigneeId={filters.assigneeId}
              members={members.data ?? []}
            />
          ) : null}
        </main>
      </div>
      {orgId ? (
        <TaskForm
          open={formOpen}
          onOpenChange={setFormOpen}
          organizationId={orgId}
          projects={projects.data ?? []}
          members={members.data ?? []}
          defaultProjectId={projectId || undefined}
          onCreated={() => {
            void queryClient.invalidateQueries({ queryKey: ["tasks"] });
          }}
        />
      ) : null}
    </div>
  );
}
