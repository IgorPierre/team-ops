import type { Task } from "@team-ops/api-client";

import { localDayKey } from "@/lib/timeline";

const DAY = 86_400_000;

export function personStats(tasks: Task[], now = Date.now()) {
  const today = localDayKey(new Date(now));
  const monthAgo = now - 30 * DAY;
  return {
    open: tasks.filter((t) => t.status !== "done").length,
    active: tasks.filter((t) => t.status === "in_progress" || t.status === "review").length,
    doneRecently: tasks.filter((t) => t.status === "done" && Date.parse(t.updatedAt) >= monthAgo).length,
    overdue: tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < today).length,
  };
}
