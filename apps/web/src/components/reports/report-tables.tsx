"use client";

import type { Project, Report } from "@team-ops/api-client";
import { BotIcon } from "lucide-react";
import Link from "next/link";

import { UserIdentity } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MemberDirectory as Directory } from "@/hooks/use-member-directory";
import { intlLocale, useT } from "@/lib/i18n";
import { formatCycle, percent } from "@/lib/report";

const num = "text-right tabular-nums";

export function PeopleTable({ rows, directory }: { rows: Report["byPerson"]; directory: Directory }) {
  const t = useT();
  if (!rows.length) return <EmptyState title={t("No work in this period")} />;
  return (
    <Table className="[&_tbody_tr]:h-14">
      <TableHeader>
        <TableRow>
          <TableHead>{t("Person")}</TableHead>
          <TableHead className={num}>{t("count|Done")}</TableHead>
          <TableHead className={num}>{t("By AI")}</TableHead>
          <TableHead className={num}>{t("count|Open")}</TableHead>
          <TableHead className={num}>{t("count|Blocked")}</TableHead>
          <TableHead className={num}>{t("Cycle")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => {
          const member = directory.get(p.id);
          return (
            <TableRow key={p.id ?? "unassigned"}>
              <TableCell className="max-w-56">
                {member ? (
                  <Link href={`/people/${member.userId}`} className="hover:underline">
                    <UserIdentity name={member.name} src={member.avatarUrl} size="sm" />
                  </Link>
                ) : (
                  <span className="text-subtle-foreground">{directory.nameOf(p.id)}</span>
                )}
              </TableCell>
              <TableCell className={`${num} text-foreground font-semibold`}>{p.completed}</TableCell>
              <TableCell className={num}>{percent(p.completedByAi, p.completed)}</TableCell>
              <TableCell className={num}>{p.open}</TableCell>
              <TableCell className={num}>{p.blocked || "—"}</TableCell>
              <TableCell className={num}>{formatCycle(p.medianCycleHours)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function ProjectsTable({ rows, projects }: { rows: Report["byProject"]; projects: Project[] }) {
  const t = useT();
  if (!rows.length) return <EmptyState title={t("No work in this period")} />;
  return (
    <Table className="[&_tbody_tr]:h-14">
      <TableHeader>
        <TableRow>
          <TableHead>{t("Project")}</TableHead>
          <TableHead className={num}>{t("count|Done")}</TableHead>
          <TableHead className={num}>{t("count|Created")}</TableHead>
          <TableHead className={num}>{t("count|Open")}</TableHead>
          <TableHead className={num}>{t("count|Overdue")}</TableHead>
          <TableHead className={num}>{t("Cycle")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="max-w-56">
              <div className="flex items-center gap-2">
                <Badge className="font-mono">{p.key}</Badge>
                <span className="text-foreground truncate font-medium">
                  {projects.find((x) => x.id === p.id)?.name}
                </span>
              </div>
            </TableCell>
            <TableCell className={`${num} text-foreground font-semibold`}>{p.completed}</TableCell>
            <TableCell className={num}>{p.created}</TableCell>
            <TableCell className={num}>{p.open}</TableCell>
            <TableCell className={num}>{p.overdue || "—"}</TableCell>
            <TableCell className={num}>{formatCycle(p.medianCycleHours)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function DeliveredList({
  tasks,
  directory,
  projects,
}: {
  tasks: Report["completed"];
  directory: Directory;
  projects: Project[];
}) {
  const t = useT();
  if (!tasks.length) return <EmptyState title={t("Nothing was completed in this period")} />;
  return (
    <ul className="divide-y">
      {tasks.map((task) => (
        <li key={task.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="text-subtle-foreground font-mono text-xs">{task.key}</span>
              <span className="text-foreground font-semibold">{task.title}</span>
              {task.source === "ai" ? (
                <Badge color="brand">
                  <BotIcon />
                  {t("AI agent")}
                </Badge>
              ) : null}
            </p>
            {task.completionSummary ? (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{task.completionSummary}</p>
            ) : null}
          </div>
          <div className="text-subtle-foreground shrink-0 text-sm sm:text-right">
            <p className="text-secondary-foreground font-medium">
              {directory.nameOf(task.assigneeId)} · {projects.find((p) => p.id === task.projectId)?.key}
            </p>
            <p>
              {task.completedAt ? new Date(task.completedAt).toLocaleDateString(intlLocale()) : ""} · {formatCycle(task.cycleHours)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
