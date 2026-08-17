"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MoonIcon, PlusIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { BoardFilters, type BoardFilterState } from "@/components/board/board-filters";
import { ProjectKanban } from "@/components/board/project-kanban";
import { TaskForm } from "@/components/board/task-form";
import { OrganizationSwitcher } from "@/components/layout/organization-switcher";
import { ProjectSwitcher } from "@/components/layout/project-switcher";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { TeamOpsError } from "@team-ops/api-client";

export default function BoardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [orgId, setOrgId] = useState<string>();
  const [projectId, setProjectId] = useState("");
  const [filters, setFilters] = useState<BoardFilterState>({
    search: "",
    priority: "",
    assigneeId: "",
  });
  const [formOpen, setFormOpen] = useState(false);

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

  return (
    <div className="flex h-svh flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <Link href="/" className="pr-2 font-semibold tracking-tight">
          Team-Ops
        </Link>
        <OrganizationSwitcher
          organizations={orgs.data ?? []}
          value={orgId}
          onChange={changeOrg}
        />
        <ProjectSwitcher
          projects={projects.data ?? []}
          value={projectId}
          onChange={setProjectId}
        />
        <BoardFilters members={members.data ?? []} value={filters} onChange={setFilters} />
        <div className="ml-auto flex items-center gap-2">
          {orgs.data?.find((item) => item.id === orgId)?.role !== "viewer" ? (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <PlusIcon />
              New task
            </Button>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </Button>
          <Link href="/settings/members" className="text-sm hover:underline">
            People
          </Link>
          <Link href="/settings/agents" className="text-sm hover:underline">
            Agents
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await api.logout();
              router.replace("/login");
            }}
          >
            {me.data?.name ?? "Account"}
          </Button>
        </div>
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
