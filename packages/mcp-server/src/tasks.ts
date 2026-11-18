import { TeamOpsClient, TeamOpsError, type Task, type TaskProof } from "@team-ops/api-client";
import { z } from "zod";

/** Client for the stdio binary, configured from TEAM_OPS_URL / TEAM_OPS_TOKEN. */
export function createApiFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const baseUrl = (env.TEAM_OPS_URL ?? "http://localhost:8080").replace(/\/$/, "") + "/v1";
  const token = env.TEAM_OPS_TOKEN;
  if (!token) {
    throw new Error("TEAM_OPS_TOKEN is required");
  }
  return new TeamOpsClient({ baseUrl, token });
}

/** Where a call happens: the token's organization, when it is bound to one (OAuth). */
export type Context = { organizationId?: string | null };

/** Pick the organization: explicit argument, then the token's, then the only one visible. */
export async function resolveOrganization(api: TeamOpsClient, ctx: Context, given?: string): Promise<string> {
  if (given) return given;
  if (ctx.organizationId) return ctx.organizationId;
  const orgs = await api.listOrganizations();
  if (orgs.length === 1) return orgs[0].id;
  throw new Error("organization_id is required: this token can see several organizations (team_ops_list_organizations).");
}

/** Accept a project id or the project key from .team-ops.json (e.g. "API"). */
export async function resolveProject(
  api: TeamOpsClient,
  organizationId: string,
  input: { project_id?: string; project_key?: string },
): Promise<string> {
  if (input.project_id) return input.project_id;
  const projects = await api.listProjects(organizationId);
  if (input.project_key) {
    const want = input.project_key.trim().toUpperCase();
    const found = projects.find((p) => p.key.toUpperCase() === want);
    if (found) return found.id;
    throw new Error(
      `No project with key "${input.project_key}". Available: ${projects.map((p) => p.key).join(", ") || "none"}.`,
    );
  }
  if (projects.length === 1) return projects[0].id;
  throw new Error(
    `project_key is required (from .team-ops.json). Available: ${projects.map((p) => `${p.key} (${p.name})`).join(", ")}.`,
  );
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

export const proofSchema = {
  proof_kind: z
    .enum(["github", "vercel", "supabase", "other", "none"])
    .optional()
    .describe(
      'Where the finished work can be checked. Required when the task moves to done: github (PR or commit), vercel (deploy), supabase (migration, function, project), other (any link), or none for work with nothing to link (planning, research).',
    ),
  proof_url: z.string().url().optional().describe("Link to the PR, commit, deploy or page. Required unless proof_kind is none."),
};

export function proofOf(input: { proof_kind?: TaskProof["kind"]; proof_url?: string }): TaskProof | undefined {
  return input.proof_kind ? { kind: input.proof_kind, url: input.proof_url } : undefined;
}

export const upsertSchema = z.object({
  organization_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  project_key: z.string().optional().describe("Project key from .team-ops.json, e.g. API"),
  task_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  acceptance_criteria: z.string().optional(),
  status: z.enum(["backlog", "in_progress", "review", "done", "production"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  external_ref: z.string().optional(),
  expected_version: z.number().int().optional(),
  ...proofSchema,
});

/** Move the card when the caller asked for a different column (e.g. reopening a done task). */
async function ensureStatus(
  api: TeamOpsClient,
  task: Task,
  status: Task["status"] | undefined,
  proof?: TaskProof,
): Promise<Task> {
  if (!status || task.status === status) return task;
  return api.moveTask(task.id, { status, proof, expectedVersion: task.version });
}

export async function upsertTask(
  api: TeamOpsClient,
  raw: z.infer<typeof upsertSchema>,
  ctx: Context = {},
): Promise<Task> {
  const organization_id = await resolveOrganization(api, ctx, raw.organization_id);
  const input = raw.task_id
    ? { ...raw, organization_id, project_id: raw.project_id ?? "" }
    : { ...raw, organization_id, project_id: await resolveProject(api, organization_id, raw) };
  const changes = {
    title: input.title,
    description: input.description,
    acceptanceCriteria: input.acceptance_criteria,
    priority: input.priority,
  };
  if (input.task_id) {
    const current = input.expected_version === undefined ? await api.getTask(input.task_id) : undefined;
    const updated = await api.updateTask(input.task_id, {
      ...changes,
      expectedVersion: input.expected_version ?? current!.version,
    });
    return ensureStatus(api, updated, input.status, proofOf(input));
  }
  if (input.external_ref) {
    const existing = await api.listTasks({
      organizationId: input.organization_id,
      projectId: input.project_id,
      externalRef: input.external_ref,
    });
    if (existing[0]) {
      const updated = await api.updateTask(existing[0].id, {
        ...changes,
        expectedVersion: input.expected_version ?? existing[0].version,
      });
      return ensureStatus(api, updated, input.status, proofOf(input));
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
    return ensureStatus(api, match, input.status, proofOf(input));
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
      proof: proofOf(input),
    });
  } catch (error) {
    if (error instanceof TeamOpsError && error.code === "DUPLICATE_EXTERNAL_REF") {
      const existing = await api.listTasks({
        organizationId: input.organization_id,
        projectId: input.project_id,
        externalRef: input.external_ref,
      });
      if (existing[0]) return ensureStatus(api, existing[0], input.status, proofOf(input));
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
