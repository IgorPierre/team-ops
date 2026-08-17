import { TeamOpsClient, TeamOpsError, type Task } from "@team-ops/api-client";
import { z } from "zod";

export function createApi(env: NodeJS.ProcessEnv = process.env) {
  const baseUrl = (env.TEAM_OPS_URL ?? "http://localhost:8080").replace(/\/$/, "") + "/v1";
  const token = env.TEAM_OPS_TOKEN;
  if (!token) {
    throw new Error("TEAM_OPS_TOKEN is required");
  }
  return new TeamOpsClient({ baseUrl, token });
}

export const progressSchema = z.object({
  task_id: z.string().uuid(),
  summary: z.string().min(1),
  branch: z.string().optional(),
  commit_shas: z.array(z.string()).optional(),
  pull_request_url: z.string().optional(),
  tests: z.string().optional(),
  blockers: z.string().optional(),
  expected_version: z.number().int(),
});

export const upsertSchema = z.object({
  organization_id: z.string().uuid(),
  project_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  acceptance_criteria: z.string().optional(),
  status: z.enum(["backlog", "in_progress", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  external_ref: z.string().optional(),
  expected_version: z.number().int().optional(),
});

export async function upsertTask(
  api: TeamOpsClient,
  input: z.infer<typeof upsertSchema>,
): Promise<Task> {
  if (input.task_id) {
    return api.updateTask(input.task_id, {
      title: input.title,
      description: input.description,
      acceptanceCriteria: input.acceptance_criteria,
      status: input.status,
      priority: input.priority,
      expectedVersion: input.expected_version,
    });
  }
  if (input.external_ref) {
    const existing = await api.listTasks({
      organizationId: input.organization_id,
      projectId: input.project_id,
      externalRef: input.external_ref,
    });
    if (existing[0]) {
      return api.updateTask(existing[0].id, {
        title: input.title,
        description: input.description,
        acceptanceCriteria: input.acceptance_criteria,
        expectedVersion: input.expected_version ?? existing[0].version,
      });
    }
  }
  const byTitle = await api.listTasks({
    organizationId: input.organization_id,
    projectId: input.project_id,
    search: input.title,
  });
  const match = byTitle.find(
    (task) => task.title.toLowerCase() === input.title.toLowerCase(),
  );
  if (match) {
    return match;
  }
  try {
    return await api.createTask({
      organizationId: input.organization_id,
      projectId: input.project_id,
      title: input.title,
      description: input.description,
      acceptanceCriteria: input.acceptance_criteria,
      status: input.status,
      priority: input.priority,
      externalRef: input.external_ref,
      source: "ai",
    });
  } catch (error) {
    if (error instanceof TeamOpsError && error.code === "DUPLICATE_EXTERNAL_REF") {
      const existing = await api.listTasks({
        organizationId: input.organization_id,
        projectId: input.project_id,
        externalRef: input.external_ref,
      });
      if (existing[0]) return existing[0];
    }
    throw error;
  }
}

export function formatError(error: unknown) {
  if (error instanceof TeamOpsError) {
    return `${error.code}: ${error.message}`;
  }
  return error instanceof Error ? error.message : "Unknown error";
}
