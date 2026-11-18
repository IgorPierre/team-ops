"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, BotIcon, UserXIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { PageBody, SectionHeader } from "@/components/layout/page-header";
import { RoleBadge } from "@/components/members/role-badge";
import { personStats } from "@/components/people/person-stats";
import { usePersonActivity } from "@/components/people/use-person-activity";
import { TaskTimeline } from "@/components/timeline/task-timeline";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ContributionSkyline from "@/components/ui/contribution-skyline";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedTabs } from "@/components/ui/tabs";
import { ProjectSelect } from "@/components/workspace/project-select";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import {
  filterTimelineTasks,
  localDayKey,
  sortTimelineTasks,
} from "@/lib/timeline";
import { useWorkspace } from "@/providers/workspace-provider";

type WorkTab = "open" | "completed" | "all";

const WORK_TABS: { value: WorkTab; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "completed", label: "tasks|Done" },
  { value: "all", label: "All" },
];

export default function PersonPage() {
  const { userId } = useParams<{ userId: string }>();
  const { orgId, user, members, membersQuery } = useWorkspace();
  const [projectId, setProjectId] = useState("");
  const [includeAgents, setIncludeAgents] = useState(true);
  const [tab, setTab] = useState<WorkTab>("open");
  const t = useT();

  const person = members.find((m) => m.userId === userId);
  const activity = usePersonActivity({
    orgId,
    userId,
    projectId,
    includeAgents,
  });

  const tasks = useQuery({
    queryKey: ["timeline-tasks", orgId, projectId, userId],
    queryFn: () =>
      api.listTasks({
        organizationId: orgId!,
        projectId: projectId || undefined,
        assigneeId: userId,
      }),
    enabled: Boolean(orgId),
  });

  const stats = useMemo(() => personStats(tasks.data ?? []), [tasks.data]);
  const work = useMemo(() => {
    const list = tasks.data ?? [];
    if (tab === "open")
      return sortTimelineTasks(
        list.filter((t) => t.status !== "done"),
        "due",
      );
    if (tab === "completed")
      return sortTimelineTasks(
        filterTimelineTasks(list, { status: "completed" }),
        "updated",
      );
    return sortTimelineTasks(list, "due");
  }, [tasks.data, tab]);

  if (membersQuery.isLoading) {
    return (
      <PageBody className="pt-2">
        <Skeleton className="h-20 w-80 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </PageBody>
    );
  }

  if (!person) {
    return (
      <EmptyState
        icon={UserXIcon}
        title={t("Not in this organization")}
        description={t(
          "This person isn't a member of the selected organization.",
        )}
        action={
          <Button variant="secondary" asChild>
            <Link href="/settings/members">{t("See people")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <PageBody className="pt-2">
      <header className="flex flex-wrap items-center gap-5">
        <UserAvatar name={person.name} src={person.avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-[1.75rem]">
              {person.name}
            </h1>
            <RoleBadge role={person.role} />
            {person.userId === user.id ? <Badge>{t("You")}</Badge> : null}
          </div>
          <p className="text-muted-foreground truncate text-base">
            {person.email}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <ProjectSelect
            size="sm"
            className="sm:w-52"
            value={projectId}
            onChange={setProjectId}
          />
          <Button variant="secondary" size="md" asChild>
            <Link href={`/timeline?person=${person.userId}`}>
              {t("Open in timeline")}
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </header>

      <MetricGrid>
        <MetricCard
          label={t("Open tasks")}
          value={stats.open}
          hint={t("Assigned and not done")}
        />
        <MetricCard
          label={t("In flight")}
          value={stats.active}
          hint={t("In progress or review")}
          tone="brand"
        />
        <MetricCard
          label={t("Shipped")}
          value={stats.doneRecently}
          hint={t("Done in the last 30 days")}
          tone="success"
        />
        <MetricCard
          label={t("Overdue")}
          value={stats.overdue}
          hint={t("Past due date")}
          tone={stats.overdue > 0 ? "error" : "default"}
        />
      </MetricGrid>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title={t("Activity")}
          description={t(
            "Moves, comments, reviews and completions on the board.",
          )}
          actions={
            activity.ownAgents.length > 0 ? (
              <label className="text-secondary-foreground inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={includeAgents}
                  onChange={(e) => setIncludeAgents(e.target.checked)}
                />
                <BotIcon className="text-subtle-foreground size-4" />
                {t("Include their agents ({names})", {
                  names: activity.ownAgents.map((a) => a.name).join(", "),
                })}
              </label>
            ) : null
          }
        />
        <ContributionSkyline
          key={`${orgId}-${projectId}`}
          className="bg-card shadow-xs"
          data={activity.contributions}
          endDate={localDayKey(new Date())}
          showStats={activity.contributions.some((day) => day.count > 0)}
          palette="github"
          defaultView="2d"
          unit="action"
          title={
            activity.loading ? (
              <span className="text-muted-foreground">
                {t("Loading activity…")}
              </span>
            ) : undefined
          }
          footer={t("Tap or hover a day for details · drag the 3D view to orbit.")}
        />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title={t("Assigned work")}
          count={tasks.data ? work.length : undefined}
          actions={
            <SegmentedTabs
              label={t("Assigned work")}
              value={tab}
              onChange={setTab}
              options={WORK_TABS.map((w) => ({ ...w, label: t(w.label) }))}
            />
          }
        />
        <div className="w-full">
          {tasks.isLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <TaskTimeline
              tasks={work}
              members={members}
              sort={tab === "completed" ? "updated" : "due"}
              showAssignee={false}
              emptyMessage={
                tab === "open"
                  ? t("Nothing open. Inbox zero.")
                  : t("No tasks here yet.")
              }
            />
          )}
        </div>
      </section>
    </PageBody>
  );
}
