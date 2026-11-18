import { describe, expect, it, vi } from "vitest";

import { TeamOpsClient, TeamOpsError } from "@team-ops/api-client";

import { formatError, progressSchema, upsertTask } from "./tasks";

describe("validation", () => {
  it("requires a progress summary", () => {
    const parsed = progressSchema.safeParse({
      task_id: "00000000-0000-0000-0000-000000000000",
      summary: "",
      expected_version: 1,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("error mapping", () => {
  it("maps TeamOpsError codes", () => {
    expect(formatError(new TeamOpsError("TASK_VERSION_CONFLICT", "conflict", 409))).toContain(
      "TASK_VERSION_CONFLICT",
    );
  });
});

describe("upsert idempotency", () => {
  it("returns the existing task for a known external_ref", async () => {
    const existing = { id: "t1", title: "Auth", version: 3, externalRef: "branch-auth" };
    const api = {
      listTasks: vi.fn().mockResolvedValue([existing]),
      updateTask: vi.fn().mockResolvedValue({ ...existing, title: "Auth" }),
      createTask: vi.fn(),
    } as unknown as TeamOpsClient;
    const result = await upsertTask(api, {
      organization_id: "00000000-0000-0000-0000-000000000001",
      project_id: "00000000-0000-0000-0000-000000000002",
      title: "Auth",
      external_ref: "branch-auth",
    });
    expect(api.createTask).not.toHaveBeenCalled();
    expect(result.id).toBe("t1");
  });

  it("moves an existing card when a different status is requested", async () => {
    const existing = { id: "t1", title: "Fix", version: 4, status: "done", externalRef: "fix/x" };
    const api = {
      listTasks: vi.fn().mockResolvedValue([existing]),
      updateTask: vi.fn().mockResolvedValue({ ...existing, version: 5 }),
      moveTask: vi.fn().mockResolvedValue({ ...existing, version: 6, status: "in_progress" }),
      createTask: vi.fn(),
    } as unknown as TeamOpsClient;
    const result = await upsertTask(api, {
      organization_id: "00000000-0000-0000-0000-000000000001",
      project_id: "00000000-0000-0000-0000-000000000002",
      title: "Fix",
      external_ref: "fix/x",
      status: "in_progress",
    });
    expect(api.moveTask).toHaveBeenCalledWith("t1", { status: "in_progress", expectedVersion: 5 });
    expect(result.status).toBe("in_progress");
  });
});
