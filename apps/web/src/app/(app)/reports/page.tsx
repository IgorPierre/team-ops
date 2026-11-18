"use client";

import { useQuery } from "@tanstack/react-query";
import { DownloadIcon, TriangleAlertIcon } from "lucide-react";
import { Suspense } from "react";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { ChartLegend, WeeklyChart } from "@/components/reports/weekly-chart";
import {
  DeliveredList,
  PeopleTable,
  ProjectsTable,
} from "@/components/reports/report-tables";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberSelect } from "@/components/workspace/member-select";
import { ProjectSelect } from "@/components/workspace/project-select";
import { useMemberDirectory } from "@/hooks/use-member-directory";
import { useQueryParams } from "@/hooks/use-query-params";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { intlLocale, useT } from "@/lib/i18n";
import {
  downloadFile,
  formatCycle,
  peopleCSV,
  percent,
  presetRange,
  RANGE_PRESETS,
  tasksCSV,
} from "@/lib/report";
import { useWorkspace } from "@/providers/workspace-provider";

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsView />
    </Suspense>
  );
}

function ReportsView() {
  const { org, orgId, projects, members } = useWorkspace();
  const directory = useMemberDirectory(members);
  const query = useQueryParams();
  const t = useT();

  const preset = query.get("range") || (query.get("from") ? "custom" : "30");
  const custom = { from: query.get("from"), to: query.get("to") };
  const range =
    preset === "custom" ? custom : presetRange(Number(preset) || 30);
  const projectId = query.get("project");
  const person = query.get("person");

  const report = useQuery({
    queryKey: ["report", orgId, range.from, range.to, projectId, person],
    queryFn: () =>
      api.getReport({
        organizationId: orgId!,
        from: range.from || undefined,
        to: range.to || undefined,
        projectId: projectId || undefined,
        assigneeId: person || undefined,
      }),
    enabled: Boolean(orgId),
  });

  const data = report.data;
  const totals = data?.totals;
  const fileSuffix = `${org?.slug ?? "team"}-${data?.from ?? range.from}-to-${data?.to ?? range.to}`;
  const period = data
    ? `${new Date(`${data.from}T00:00:00`).toLocaleDateString(intlLocale())} – ${new Date(`${data.to}T00:00:00`).toLocaleDateString(intlLocale())}`
    : null;

  return (
    <>
      <PageHeader
        title={
          person
            ? `${t("Reports")} · ${directory.nameOf(person)}`
            : t("Reports")
        }
        actions={
          data ? (
            <Button
              variant="secondary"
              size="md"
              onClick={() =>
                downloadFile(
                  `tasks-${fileSuffix}.csv`,
                  tasksCSV(data, members, projects),
                )
              }
            >
              <DownloadIcon />
              {t("Export CSV")}
            </Button>
          ) : null
        }
      />
      <PageBody>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            size="sm"
            className="sm:w-44"
            aria-label={t("Period")}
            value={preset}
            onChange={(e) =>
              e.target.value === "custom"
                ? query.set({ range: "custom", from: range.from, to: range.to })
                : query.set({
                    range: e.target.value === "30" ? "" : e.target.value,
                    from: "",
                    to: "",
                  })
            }
          >
            {RANGE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {t(p.label)}
              </option>
            ))}
            <option value="custom">{t("Custom dates")}</option>
          </Select>
          {preset === "custom" ? (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Input
                size="sm"
                type="date"
                aria-label={t("From")}
                className="sm:w-40"
                value={custom.from}
                max={custom.to || undefined}
                onChange={(e) => query.set({ from: e.target.value })}
              />
              <span className="text-subtle-foreground text-sm">{t("to")}</span>
              <Input
                size="sm"
                type="date"
                aria-label={t("To")}
                className="sm:w-40"
                value={custom.to}
                min={custom.from || undefined}
                onChange={(e) => query.set({ to: e.target.value })}
              />
            </div>
          ) : null}
          <MemberSelect
            size="sm"
            className="sm:w-48"
            value={person}
            onChange={(id) => query.set({ person: id })}
          />
          <ProjectSelect
            size="sm"
            className="sm:w-56"
            value={projectId}
            onChange={(id) => query.set({ project: id })}
          />
          {period ? (
            <p className="text-subtle-foreground text-sm sm:ml-auto">
              {period}
            </p>
          ) : null}
        </div>

        {report.isLoading || !orgId ? (
          <div className="flex flex-col gap-6" aria-busy="true">
            <MetricGrid className="lg:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </MetricGrid>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : report.isError || !data || !totals ? (
          <EmptyState
            icon={TriangleAlertIcon}
            tone="error"
            title={t("Could not load the report")}
            description={errorMessage(
              report.error,
              t("Try again in a moment."),
            )}
          />
        ) : (
          <>
            <MetricGrid className="lg:grid-cols-5">
              <MetricCard
                label={t("count|Completed")}
                value={totals.completed}
                hint={t("{percent} by AI agents", {
                  percent: percent(totals.completedByAi, totals.completed),
                })}
              />
              <MetricCard
                label={t("count|Created")}
                value={totals.created}
                hint={t("New cards in the period")}
              />
              <MetricCard
                label={t("Open now")}
                value={totals.open}
                hint={t("{inProgress} in progress · {review} in review", {
                  inProgress: totals.inProgress,
                  review: totals.review,
                })}
              />
              <MetricCard
                label={t("Cycle time")}
                value={formatCycle(totals.medianCycleHours)}
                hint={t("Median start → done · avg {avg}", {
                  avg: formatCycle(totals.avgCycleHours),
                })}
              />
              <MetricCard
                label={t("Blocked / overdue")}
                value={`${totals.blocked} / ${totals.overdue}`}
                hint={t("Open cards needing attention")}
                tone={totals.blocked + totals.overdue > 0 ? "error" : "default"}
              />
            </MetricGrid>

            <Panel
              title={t("Created vs completed")}
              description={t("Cards per week in the selected period.")}
              actions={<ChartLegend />}
            >
              <WeeklyChart weeks={data.weekly} />
            </Panel>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel
                title={t("By person")}
                bodyClassName="p-0"
                actions={
                  <Button
                    variant="tertiary"
                    onClick={() =>
                      downloadFile(
                        `people-${fileSuffix}.csv`,
                        peopleCSV(data, members),
                      )
                    }
                  >
                    <DownloadIcon />
                    CSV
                  </Button>
                }
              >
                <PeopleTable rows={data.byPerson} directory={directory} />
              </Panel>
              <Panel title={t("By project")} bodyClassName="p-0">
                <ProjectsTable rows={data.byProject} projects={projects} />
              </Panel>
            </div>

            <Panel
              title={`${t("Delivered")} · ${data.completed.length}`}
              bodyClassName="p-0"
            >
              <DeliveredList
                tasks={data.completed}
                directory={directory}
                projects={projects}
              />
            </Panel>
          </>
        )}
      </PageBody>
    </>
  );
}
