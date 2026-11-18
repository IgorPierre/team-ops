import { describe, expect, it } from "vitest";

import { COLUMN_ORDER, diffBoard, emptyBoard, groupTasks, applyTask, positionForIndex } from "@/lib/board";
import type { Task } from "@team-ops/api-client";

function task(partial: Partial<Task> & Pick<Task, "id" | "status" | "position">): Task {
  return {
    number: 1,
    key: "ERP-1",
    organizationId: "org",
    projectId: "proj",
    projectKey: "ERP",
    projectName: "ERP",
    title: "Task",
    description: "",
    acceptanceCriteria: "",
    priority: "medium",
    blocked: false,
    source: "manual",
    sourceMetadata: {},
    version: 1,
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("board grouping", () => {
  it("keeps all six columns including empty review", () => {
    const columns = groupTasks([
      task({ id: "1", status: "backlog", position: "1000" }),
      task({ id: "2", status: "done", position: "1000" }),
    ]);
    expect(Object.keys(columns)).toEqual([...COLUMN_ORDER]);
    expect(columns.review).toEqual([]);
    expect(columns.in_progress).toEqual([]);
  });
});

describe("positionForIndex", () => {
  it("inserts between neighbors without renumbering", () => {
    const column = [
      task({ id: "a", status: "backlog", position: "1000" }),
      task({ id: "moved", status: "backlog", position: "9999" }),
      task({ id: "b", status: "backlog", position: "2000" }),
    ];
    expect(positionForIndex(column, 1)).toBe("1500");
  });
});

describe("diffBoard", () => {
  it("reports only moved tasks", () => {
    const prev = groupTasks([
      task({ id: "1", status: "backlog", position: "1000", version: 4 }),
      task({ id: "2", status: "backlog", position: "2000", version: 1 }),
    ]);
    const next = emptyBoard();
    next.backlog = [prev.backlog[1]];
    next.in_progress = [prev.backlog[0]];
    const changes = diffBoard(prev, next, "1");
    expect(changes).toHaveLength(1);
    expect(changes[0]?.id).toBe("1");
    expect(changes[0]?.status).toBe("in_progress");
  });
});

describe("blocked and production columns", () => {
  it("shows a blocked task only in Blocked and restores its status when resolved", () => {
    const blocked = task({ id: "blocked", status: "review", position: "1000", blocked: true, blockedReason: "Waiting for access" });
    const columns = groupTasks([blocked, task({ id: "live", status: "production", position: "1000" })]);
    expect(columns.blocked).toEqual([blocked]);
    expect(columns.review).toEqual([]);
    expect(columns.production[0].id).toBe("live");
    const resolved = applyTask(columns, { ...blocked, blocked: false });
    expect(resolved.blocked).toEqual([]);
    expect(resolved.review[0].id).toBe("blocked");
  });

  it("distinguishes a blocker drop from a real status move", () => {
    const previous = groupTasks([task({ id: "1", status: "in_progress", position: "1000" })]);
    const next = emptyBoard();
    next.blocked = previous.in_progress;
    expect(diffBoard(previous, next, "1")[0].status).toBe("blocked");
    next.blocked = [];
    next.production = previous.in_progress;
    expect(diffBoard(previous, next, "1")[0].status).toBe("production");
  });
});
