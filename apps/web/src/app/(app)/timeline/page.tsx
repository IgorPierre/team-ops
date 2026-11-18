"use client";

import { useQuery } from "@tanstack/react-query";
import { TriangleAlertIcon } from "lucide-react";
import { Suspense, useMemo } from "react";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { TaskTimeline } from "@/components/timeline/task-timeline";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedTabs } from "@/components/ui/tabs";
import { MemberSelect } from "@/components/workspace/member-select";
import { ProjectSelect } from "@/components/workspace/project-select";
import { useMemberDirectory } from "@/hooks/use-member-directory";
import { useQueryParams } from "@/hooks/use-query-params";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import {
  filterTimelineTasks,
  sortTimelineTasks,
  UNASSIGNED,
  type TimelineSort,
  type TimelineStatusFilter,
} from "@/lib/timeline";
import { useWorkspace } from "@/providers/workspace-provider";

const STATUS_TABS: { value: TimelineStatusFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "upcoming", label: "Backlog" },
  { value: "current", label: "In progress" },
  { value: "completed", label: "Done" },
];

export default function TimelinePage() {
  return (
    <Suspense fallback={null}>
      <TimelineView />
    </Suspense>
  );
}

function TimelineView() {
  const { orgId, members } = useWorkspace();
  const directory = useMemberDirectory(members);
  const query = useQueryParams();
  const t = useT();

  const projectId = query.get("project");
  const person = query.get("person");
  const status = query.get("status") as TimelineStatusFilter;
  const sort: TimelineSort =
    query.get("sort") === "updated" ? "updated" : "due";

  // Server narrows by project and a concrete person; "unassigned" and status are filtered here.
  const tasks = useQuery({
    queryKey: ["timeline-tasks", orgId, projectId, person],
    queryFn: () =>
      api.listTasks({
        organizationId: orgId!,
        projectId: projectId || undefined,
        assigneeId: person && person !== UNASSIGNED ? person : undefined,
      }),
    enabled: Boolean(orgId),
  });

  const visible = useMemo(
    () =>
      sortTimelineTasks(
        filterTimelineTasks(tasks.data ?? [], { person, status }),
        sort,
      ),
    [tasks.data, person, status, sort],
  );

  const counts = useMemo(() => {
    const base = filterTimelineTasks(tasks.data ?? [], { person });
    const count = (s: TimelineStatusFilter) =>
      s ? filterTimelineTasks(base, { status: s }).length : base.length;
    return Object.fromEntries(
      STATUS_TABS.map((tab) => [tab.value, count(tab.value)]),
    ) as Record<TimelineStatusFilter, number>;
  }, [tasks.data, person]);

  const personName =
    person === UNASSIGNED ? t("Unassigned") : directory.get(person)?.name;

  return (
    <>
      <PageHeader
        title={
          personName
            ? t("Timeline · {name}", { name: personName })
            : t("Timeline")
        }
      />
      <PageBody className="gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <MemberSelect
              size="sm"
              className="sm:w-48"
              includeUnassigned
              value={person}
              onChange={(id) => query.set({ person: id })}
            />
            <ProjectSelect
              size="sm"
              className="sm:w-56"
              value={projectId}
              onChange={(id) => query.set({ project: id })}
            />
            <Select
              size="sm"
              className="sm:ml-auto sm:w-48"
              aria-label={t("Order")}
              value={sort}
              onChange={(e) =>
                query.set({
                  sort: e.target.value === "updated" ? "updated" : "",
                })
              }
            >
              <option value="due">{t("Sort by due date")}</option>
              <option value="updated">{t("Recently updated")}</option>
            </Select>
          </div>
          <SegmentedTabs
            label={t("Status")}
            value={status}
            onChange={(value) => query.set({ status: value })}
            options={STATUS_TABS.map((tab) => ({
              ...tab,
              label: t(tab.label),
              count: tasks.data ? counts[tab.value] : undefined,
            }))}
          />
        </div>

        <div className="w-full">
          {tasks.isLoading ? (
            <div className="flex flex-col gap-4" aria-busy="true">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="size-10 rounded-full" />
                  <Skeleton className="h-32 flex-1 rounded-xl" />
                </div>
              ))}
            </div>
          ) : tasks.isError ? (
            <EmptyState
              icon={TriangleAlertIcon}
              tone="error"
              title={t("Could not load tasks")}
              description={t("Try again in a moment.")}
            />
          ) : (
            <TaskTimeline
              tasks={visible}
              members={members}
              sort={sort}
              showAssignee={person === ""}
              emptyMessage={t("No tasks match these filters.")}
            />
          )}
        </div>
      </PageBody>
    </>
  );
}
