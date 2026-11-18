import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TeamOpsClient } from "@team-ops/api-client";
import { z } from "zod";

import {
  formatError,
  progressSchema,
  proofOf,
  proofSchema,
  resolveOrganization,
  resolveProject,
  upsertSchema,
  upsertTask,
  type Context,
} from "./tasks";

/**
 * Sent to the client when it connects; editors such as Claude Code add it to
 * the agent's context. It is the essence of the Team-Ops skill, so the board
 * stays current even when nobody installed the skill files.
 */
export const INSTRUCTIONS = `Team-Ops is the team's Kanban. Developers don't write cards by hand: you keep the board in sync with the coding work you do.

Project: read .team-ops.json in the repo root and pass its "projectKey" as project_key. If it is missing, call team_ops_list_projects, ask the user which project this repo belongs to, and save {"projectKey": "<KEY>"} to .team-ops.json.

For every coding task (not for pure questions):
1. Start: if the user named a card (e.g. API-142) find it with team_ops_list_tasks search; otherwise team_ops_upsert_task with a short outcome title, 1-3 sentence description, external_ref = branch name or a stable slug, status "in_progress", acceptance_criteria as a "- [ ] item" checklist (the board shows it as a progress bar).
2. During: tick finished checklist items ("- [x]") with team_ops_upsert_task; team_ops_report_progress after meaningful steps (commit, tests); team_ops_block_task if a human must unblock; team_ops_request_review when a PR is open.
3. End: team_ops_complete_task with a completion_summary a manager understands without reading code (what changed, where, how it was verified, follow-ups) and proof: where the work can be checked. proof_kind "github" + the PR or commit URL, "vercel" + the deploy URL, "supabase" + the dashboard link of the migration or function, "other" + any link, or "none" only for work with nothing to link (planning, research). The board refuses to mark a card done without it.

Always pass expected_version from the latest task payload; on TASK_VERSION_CONFLICT fetch the task and retry once. Never put secrets or customer data on cards. If a board call fails, say so in one line and keep coding.`;

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(error: unknown) {
  return { isError: true as const, content: [{ type: "text" as const, text: formatError(error) }] };
}

/** Run a tool body, turning thrown errors into MCP tool errors the agent can read. */
function safe<A>(fn: (args: A) => Promise<unknown>) {
  return async (args: A) => {
    try {
      return json(await fn(args));
    } catch (error) {
      return fail(error);
    }
  };
}

const status = z.enum(["backlog", "in_progress", "review", "done", "production"]);
const orgArg = z.string().uuid().optional().describe("Defaults to the organization you signed in to");

/**
 * The Team-Ops MCP server. `api` carries the caller's credentials (an OAuth
 * access token on the hosted endpoint, an API key for the stdio binary).
 */
export function createTeamOpsServer(api: TeamOpsClient, ctx: Context = {}, version = "0.1.0") {
  const server = new McpServer({ name: "team-ops", version }, { instructions: INSTRUCTIONS });

  server.tool("team_ops_list_organizations", "List organizations visible to this connection", {}, safe(() => api.listOrganizations()));

  server.tool(
    "team_ops_list_projects",
    "List board projects (id, key, name). Use the key as project_key.",
    { organization_id: orgArg },
    safe(async ({ organization_id }) => api.listProjects(await resolveOrganization(api, ctx, organization_id))),
  );

  server.tool(
    "team_ops_list_tasks",
    "List or search tasks. `search` matches a task key like API-142, title, description or external_ref.",
    {
      organization_id: orgArg,
      project_id: z.string().uuid().optional(),
      project_key: z.string().optional(),
      status: status.optional(),
      search: z.string().optional(),
      external_ref: z.string().optional(),
    },
    safe(async (input) => {
      const organizationId = await resolveOrganization(api, ctx, input.organization_id);
      const projectId =
        input.project_id || input.project_key ? await resolveProject(api, organizationId, input) : undefined;
      return api.listTasks({
        organizationId,
        projectId,
        status: input.status,
        search: input.search,
        externalRef: input.external_ref,
      });
    }),
  );

  server.tool("team_ops_get_task", "Get a task by id", { task_id: z.string().uuid() }, safe(({ task_id }) => api.getTask(task_id)));

  server.tool(
    "team_ops_upsert_task",
    "Create or update a task. Looks up external_ref, then title, before creating. Passing `status` also moves an existing card (e.g. reopening a done one). New tasks are assigned to the person who connected this agent.",
    upsertSchema.shape,
    safe((input) => upsertTask(api, input, ctx)),
  );

  server.tool(
    "team_ops_move_task",
    "Move a task to another column",
    {
      task_id: z.string().uuid(),
      status,
      position: z.string().optional(),
      expected_version: z.number().int(),
      ...proofSchema,
    },
    safe((input) =>
      api.moveTask(input.task_id, {
        status: input.status,
        position: input.position,
        proof: proofOf(input),
        expectedVersion: input.expected_version,
      }),
    ),
  );

  server.tool(
    "team_ops_report_progress",
    "Record progress on a task",
    progressSchema.shape,
    safe((input) =>
      api.reportProgress(input.task_id, {
        summary: input.summary,
        branch: input.branch,
        commitShas: input.commit_shas,
        pullRequestUrl: input.pull_request_url,
        tests: input.tests,
        blockers: input.blockers,
        expectedVersion: input.expected_version,
      }),
    ),
  );

  server.tool(
    "team_ops_add_comment",
    "Add a comment to a task",
    { task_id: z.string().uuid(), content: z.string().min(1) },
    safe((input) => api.addComment(input.task_id, { content: input.content })),
  );

  server.tool(
    "team_ops_block_task",
    "Mark a task as blocked",
    { task_id: z.string().uuid(), reason: z.string().min(1), expected_version: z.number().int() },
    safe((input) => api.blockTask(input.task_id, { reason: input.reason, expectedVersion: input.expected_version })),
  );

  server.tool(
    "team_ops_unblock_task",
    "Clear a task blocker",
    { task_id: z.string().uuid(), expected_version: z.number().int() },
    safe((input) => api.unblockTask(input.task_id, { expectedVersion: input.expected_version })),
  );

  server.tool(
    "team_ops_request_review",
    "Move a task from in progress to review",
    {
      task_id: z.string().uuid(),
      summary: z.string().min(1),
      pull_request_url: z.string().optional(),
      commit_shas: z.array(z.string()).optional(),
      tests: z.string().optional(),
      expected_version: z.number().int(),
    },
    safe((input) =>
      api.requestReview(input.task_id, {
        summary: input.summary,
        pullRequestUrl: input.pull_request_url,
        commitShas: input.commit_shas,
        tests: input.tests,
        expectedVersion: input.expected_version,
      }),
    ),
  );

  server.tool(
    "team_ops_complete_task",
    "Complete a task. completion_summary is required (what changed, where, how it was verified), and so is proof: where the work can be checked.",
    {
      task_id: z.string().uuid(),
      completion_summary: z.string().min(1),
      acceptance_criteria_met: z.literal(true),
      expected_version: z.number().int(),
      ...proofSchema,
    },
    safe((input) =>
      api.completeTask(input.task_id, {
        completionSummary: input.completion_summary,
        acceptanceCriteriaMet: input.acceptance_criteria_met,
        proof: proofOf(input),
        expectedVersion: input.expected_version,
      }),
    ),
  );

  return server;
}
