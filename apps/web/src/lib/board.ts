import type { Task, TaskStatus } from "@team-ops/api-client";

export const COLUMN_ORDER = ["backlog", "in_progress", "review", "done"] as const;

export type ColumnId = (typeof COLUMN_ORDER)[number];

export const COLUMN_TITLES: Record<ColumnId, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export type BoardColumns = Record<ColumnId, Task[]>;

export function emptyBoard(): BoardColumns {
  return {
    backlog: [],
    in_progress: [],
    review: [],
    done: [],
  };
}

export function groupTasks(tasks: Task[]): BoardColumns {
  const columns = emptyBoard();
  for (const task of tasks) {
    const status = (COLUMN_ORDER as readonly string[]).includes(task.status)
      ? (task.status as ColumnId)
      : "backlog";
    columns[status].push(task);
  }
  for (const id of COLUMN_ORDER) {
    columns[id].sort((a, b) => Number(a.position) - Number(b.position));
  }
  return columns;
}

export function positionForIndex(column: Task[], index: number): string {
  const before = index > 0 ? Number(column[index - 1]?.position) : undefined;
  const after =
    index < column.length - 1 ? Number(column[index + 1]?.position) : undefined;
  if (before === undefined && after === undefined) return "1000";
  if (before === undefined) return String(after! / 2);
  if (after === undefined) return String(before + 1000);
  return String((before + after) / 2);
}

export interface BoardChange {
  id: string;
  status: TaskStatus;
  position: string;
  expectedVersion: number;
}

export function diffBoard(
  previous: BoardColumns,
  next: BoardColumns,
  movedId?: string,
): BoardChange[] {
  const prevById = new Map<string, { status: ColumnId; index: number; task: Task }>();
  for (const status of COLUMN_ORDER) {
    previous[status].forEach((task, index) => {
      prevById.set(task.id, { status, index, task });
    });
  }
  const changes: BoardChange[] = [];
  for (const status of COLUMN_ORDER) {
    next[status].forEach((task, index) => {
      if (movedId && task.id !== movedId) return;
      const prev = prevById.get(task.id);
      if (!prev) return;
      const moved = prev.status !== status || prev.index !== index;
      if (!moved) return;
      changes.push({
        id: task.id,
        status,
        position: positionForIndex(next[status], index),
        expectedVersion: task.version,
      });
    });
  }
  return changes;
}

export function applyTask(columns: BoardColumns, task: Task): BoardColumns {
  const next = emptyBoard();
  for (const status of COLUMN_ORDER) {
    next[status] = columns[status].filter((item) => item.id !== task.id);
  }
  const status = (COLUMN_ORDER as readonly string[]).includes(task.status)
    ? (task.status as ColumnId)
    : "backlog";
  next[status] = [...next[status], task].sort(
    (a, b) => Number(a.position) - Number(b.position),
  );
  return next;
}
