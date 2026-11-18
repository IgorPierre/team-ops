import type { Member, Project, Report, ReportTask } from "@team-ops/api-client";

import { intlLocale, translate } from "@/lib/i18n";

/** YYYY-MM-DD in local time. */
export function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const RANGE_PRESETS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
] as const;

/** Inclusive [from, to] for "the last N days", ending today. */
export function presetRange(days: number, today = new Date()): { from: string; to: string } {
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: isoDay(from), to: isoDay(today) };
}

/** 5.2 h under two days, otherwise days. Null → em dash. */
export function formatCycle(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return "—";
  const value = hours < 48 ? hours : hours / 24;
  const digits = value < 10 ? 1 : 0;
  const formatted = value.toLocaleString(intlLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${formatted} ${hours < 48 ? "h" : "d"}`;
}

export function percent(part: number, whole: number): string {
  if (!whole) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

const TASK_COLUMNS = [
  "Key",
  "Title",
  "Project",
  "Person",
  "Status",
  "Priority",
  "Source",
  "Blocked",
  "Created",
  "Started",
  "Completed",
  "Due",
  "Cycle hours",
  "Summary",
];

// Counts of cards, so the "count|" variants (plural in pt/es).
const PEOPLE_COLUMNS = [
  "Person",
  "count|Completed",
  "Completed by AI",
  "count|Created",
  "count|Open",
  "In progress",
  "Review",
  "count|Blocked",
  "count|Overdue",
  "Avg cycle hours",
  "Median cycle hours",
];

/** Every task in the report (finished in the period + still open), one row each. */
export function tasksCSV(report: Report, members: Member[], projects: Project[]): string {
  const person = (id: string | null) =>
    members.find((m) => m.userId === id)?.name ?? translate(id ? "Unknown" : "Unassigned");
  const project = (id: string) => projects.find((p) => p.id === id)?.name ?? "";
  const row = (t: ReportTask) => [
    t.key,
    t.title,
    project(t.projectId),
    person(t.assigneeId),
    t.status,
    t.priority,
    t.source === "ai" ? translate("AI agent") : t.source,
    t.blocked ? translate("yes") : "",
    t.createdAt.slice(0, 10),
    t.startedAt?.slice(0, 10) ?? "",
    t.completedAt?.slice(0, 10) ?? "",
    t.dueDate ?? "",
    t.cycleHours ?? "",
    t.completionSummary ?? "",
  ];
  return toCSV(
    TASK_COLUMNS.map((c) => translate(c)),
    [...report.completed, ...report.open].map(row),
  );
}

/** One row per person: the summary table as a spreadsheet. */
export function peopleCSV(report: Report, members: Member[]): string {
  return toCSV(
    PEOPLE_COLUMNS.map((c) => translate(c)),
    report.byPerson.map((p) => [
      p.id ? (members.find((m) => m.userId === p.id)?.name ?? translate("Unknown")) : translate("Unassigned"),
      p.completed,
      p.completedByAi,
      p.created,
      p.open,
      p.inProgress,
      p.review,
      p.blocked,
      p.overdue,
      p.avgCycleHours ?? "",
      p.medianCycleHours ?? "",
    ]),
  );
}

export function downloadFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  // BOM so Excel opens UTF-8 (accents, emoji) correctly.
  const blob = new Blob(["﻿", content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
