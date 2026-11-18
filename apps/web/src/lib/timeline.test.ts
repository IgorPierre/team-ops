import { describe, expect, it } from "vitest";

import {
  contributionsFromActivity,
  filterTimelineTasks,
  sortTimelineTasks,
  timelineStatus,
  UNASSIGNED,
} from "@/lib/timeline";
import type { OrgActivity, Task } from "@team-ops/api-client";

function task(partial: Partial<Task> & Pick<Task, "id">): Task {
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
    status: "backlog",
    priority: "medium",
    blocked: false,
    source: "manual",
    sourceMetadata: {},
    position: "1000",
    version: 1,
    commentCount: 0,
    createdAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-01-01T10:00:00Z",
    ...partial,
  };
}

describe("timelineStatus", () => {
  it("maps board columns onto timeline states", () => {
    expect(timelineStatus("done")).toBe("completed");
    expect(timelineStatus("in_progress")).toBe("current");
    expect(timelineStatus("review")).toBe("current");
    expect(timelineStatus("backlog")).toBe("upcoming");
  });
});

describe("filterTimelineTasks", () => {
  const tasks = [
    task({ id: "a", assigneeId: "u1", status: "done" }),
    task({ id: "b", assigneeId: "u2", status: "in_progress" }),
    task({ id: "c", assigneeId: null, status: "backlog" }),
  ];

  it("filters by person, including unassigned", () => {
    expect(filterTimelineTasks(tasks, { person: "u1" }).map((t) => t.id)).toEqual(["a"]);
    expect(filterTimelineTasks(tasks, { person: UNASSIGNED }).map((t) => t.id)).toEqual(["c"]);
    expect(filterTimelineTasks(tasks, {}).map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("filters by timeline status", () => {
    expect(filterTimelineTasks(tasks, { status: "current" }).map((t) => t.id)).toEqual(["b"]);
  });
});

describe("sortTimelineTasks", () => {
  it("orders a schedule: done, then dated, then undated", () => {
    const sorted = sortTimelineTasks(
      [
        task({ id: "undated", createdAt: "2026-01-02T00:00:00Z" }),
        task({ id: "late", dueDate: "2026-03-01" }),
        task({ id: "done", status: "done", updatedAt: "2026-02-01T00:00:00Z" }),
        task({ id: "soon", dueDate: "2026-02-10" }),
      ],
      "due",
    );
    expect(sorted.map((t) => t.id)).toEqual(["done", "soon", "late", "undated"]);
  });

  it("orders a feed newest first", () => {
    const sorted = sortTimelineTasks(
      [
        task({ id: "old", updatedAt: "2026-01-01T00:00:00Z" }),
        task({ id: "new", updatedAt: "2026-05-01T00:00:00Z" }),
      ],
      "updated",
    );
    expect(sorted.map((t) => t.id)).toEqual(["new", "old"]);
  });
});

describe("contributionsFromActivity", () => {
  it("counts activity per day", () => {
    const at = (createdAt: string): OrgActivity => ({
      id: createdAt,
      taskId: "t",
      taskKey: "ERP-1",
      taskTitle: "x",
      projectId: "p",
      actorType: "user",
      action: "task.moved",
      createdAt,
    });
    const days = contributionsFromActivity([
      at("2026-03-01T12:00:00"),
      at("2026-03-01T13:00:00"),
      at("2026-03-03T09:00:00"),
    ]);
    expect(days).toEqual([
      { date: "2026-03-01", count: 2 },
      { date: "2026-03-03", count: 1 },
    ]);
  });
});
