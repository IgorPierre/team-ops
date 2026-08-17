import { describe, expect, it, vi } from "vitest";

import { TeamOpsClient, TeamOpsError } from "@team-ops/api-client";

import { formatError, progressSchema, upsertTask } from "./client";

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
});
