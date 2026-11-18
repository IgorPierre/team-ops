import type { OrgActivity, Task, TaskStatus } from "@team-ops/api-client";

import { intlLocale } from "@/lib/i18n";

export type TimelineStatus = "completed" | "current" | "upcoming";
export type TimelineSort = "due" | "updated";
export type TimelineStatusFilter = "" | TimelineStatus;

/** Sentinel for the person filter: tasks nobody owns yet. */
export const UNASSIGNED = "unassigned";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  review: "In review",
  done: "Done",
};

export function timelineStatus(status: TaskStatus): TimelineStatus {
  if (status === "done") return "completed";
  if (status === "in_progress" || status === "review") return "current";
  return "upcoming";
}

/** How far along the card is, for the progress bar under each timeline item. */
export function timelineProgress(status: TaskStatus): number {
  switch (status) {
    case "done":
      return 100;
    case "review":
      return 85;
    case "in_progress":
      return 55;
    default:
      return 15;
  }
}

/**
 * The moment a task sits at on the timeline. Done work is pinned to when it
 * last changed (i.e. when it was finished); open work to its due date, or to
 * when it was created if it has none.
 */
export function timelineDate(task: Task, sort: TimelineSort): string {
  if (sort === "updated" || task.status === "done") return task.updatedAt;
  return task.dueDate ?? task.createdAt;
}

export function filterTimelineTasks(
  tasks: Task[],
  filter: { person?: string; status?: TimelineStatusFilter },
): Task[] {
  return tasks.filter((task) => {
    if (filter.person === UNASSIGNED && task.assigneeId) return false;
    if (filter.person && filter.person !== UNASSIGNED && task.assigneeId !== filter.person) return false;
    if (filter.status && timelineStatus(task.status) !== filter.status) return false;
    return true;
  });
}

function dateValue(value: string): number {
  // Due dates are plain "YYYY-MM-DD"; read them as local midnight like the board does.
  const ms = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`).getTime() : Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * "updated": newest first — a feed of what just happened.
 * "due": a schedule — finished work first (oldest → newest), then open work by
 * due date, then open work without a date by creation.
 */
export function sortTimelineTasks(tasks: Task[], sort: TimelineSort): Task[] {
  const out = [...tasks];
  if (sort === "updated") {
    return out.sort((a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt));
  }
  const bucket = (t: Task) => (t.status === "done" ? 0 : t.dueDate ? 1 : 2);
  return out.sort((a, b) => {
    const d = bucket(a) - bucket(b);
    if (d !== 0) return d;
    return dateValue(timelineDate(a, sort)) - dateValue(timelineDate(b, sort));
  });
}

/** Local calendar day of a timestamp, as "YYYY-MM-DD". */
export function localDayKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Collapse an activity feed into one `{ date, count }` per day for the contribution chart. */
export function contributionsFromActivity(activity: OrgActivity[]): { date: string; count: number }[] {
  const byDay = new Map<string, number>();
  for (const item of activity) {
    const key = localDayKey(item.createdAt);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));
}

export function formatTimelineDate(value: string): string {
  const ms = dateValue(value);
  if (!ms) return "";
  return new Date(ms).toLocaleDateString(intlLocale(), { day: "numeric", month: "short", year: "numeric" });
}

export function truncate(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}
