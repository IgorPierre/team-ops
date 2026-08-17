#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { createApi, formatError, progressSchema, upsertSchema, upsertTask } from "./client.js";

const server = new McpServer({
  name: "team-ops",
  version: "0.1.0",
});

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(error: unknown) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: formatError(error) }],
  };
}

server.tool("team_ops_list_organizations", "List organizations visible to this agent", {}, async () => {
  try {
    return json(await createApi().listOrganizations());
  } catch (error) {
    return fail(error);
  }
});

server.tool(
  "team_ops_list_projects",
  "List projects in an organization",
  { organization_id: z.string().uuid() },
  async ({ organization_id }) => {
    try {
      return json(await createApi().listProjects(organization_id));
    } catch (error) {
      return fail(error);
    }
  },
);

server.tool(
  "team_ops_list_tasks",
  "List tasks with optional filters",
  {
    organization_id: z.string().uuid(),
    project_id: z.string().uuid().optional(),
    status: z.enum(["backlog", "in_progress", "review", "done"]).optional(),
    search: z.string().optional(),
    external_ref: z.string().optional(),
  },
  async (input) => {
    try {
      return json(
        await createApi().listTasks({
          organizationId: input.organization_id,
          projectId: input.project_id,
          status: input.status,
          search: input.search,
          externalRef: input.external_ref,
        }),
      );
    } catch (error) {
      return fail(error);
    }
  },
);

server.tool(
  "team_ops_get_task",
  "Get a task by id",
  { task_id: z.string().uuid() },
  async ({ task_id }) => {
    try {
      return json(await createApi().getTask(task_id));
    } catch (error) {
      return fail(error);
    }
  },
);

server.tool(
  "team_ops_upsert_task",
  "Create or update a task. Looks up external_ref, then title, before creating.",
  upsertSchema.shape,
  async (input) => {
    try {
      return json(await upsertTask(createApi(), input));
    } catch (error) {
      return fail(error);
    }
  },
);

server.tool(
  "team_ops_move_task",
  "Move a task to another column",
  {
    task_id: z.string().uuid(),
    status: z.enum(["backlog", "in_progress", "review", "done"]),
    position: z.string().optional(),
    expected_version: z.number().int(),
  },
  async (input) => {
    try {
      return json(
        await createApi().moveTask(input.task_id, {
          status: input.status,
          position: input.position,
          expectedVersion: input.expected_version,
        }),
      );
    } catch (error) {
      return fail(error);
    }
  },
);

server.tool("team_ops_report_progress", "Record progress on a task", progressSchema.shape, async (input) => {
  try {
    return json(
      await createApi().reportProgress(input.task_id, {
        summary: input.summary,
        branch: input.branch,
        commitShas: input.commit_shas,
        pullRequestUrl: input.pull_request_url,
        tests: input.tests,
        blockers: input.blockers,
        expectedVersion: input.expected_version,
      }),
    );
  } catch (error) {
    return fail(error);
  }
});

server.tool(
  "team_ops_add_comment",
  "Add a comment to a task",
  { task_id: z.string().uuid(), content: z.string().min(1) },
  async (input) => {
    try {
      return json(await createApi().addComment(input.task_id, { content: input.content }));
    } catch (error) {
      return fail(error);
    }
  },
);

server.tool(
  "team_ops_block_task",
  "Mark a task as blocked",
  {
    task_id: z.string().uuid(),
    reason: z.string().min(1),
    expected_version: z.number().int(),
  },
  async (input) => {
    try {
      return json(
        await createApi().blockTask(input.task_id, {
          reason: input.reason,
          expectedVersion: input.expected_version,
        }),
      );
    } catch (error) {
      return fail(error);
    }
  },
);

server.tool(
  "team_ops_unblock_task",
  "Clear a task blocker",
  { task_id: z.string().uuid(), expected_version: z.number().int() },
  async (input) => {
    try {
      return json(
        await createApi().unblockTask(input.task_id, { expectedVersion: input.expected_version }),
      );
    } catch (error) {
      return fail(error);
    }
  },
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
  async (input) => {
    try {
      return json(
        await createApi().requestReview(input.task_id, {
          summary: input.summary,
          pullRequestUrl: input.pull_request_url,
          commitShas: input.commit_shas,
          tests: input.tests,
          expectedVersion: input.expected_version,
        }),
      );
    } catch (error) {
      return fail(error);
    }
  },
);

server.tool(
  "team_ops_complete_task",
  "Complete a task. completion_summary is required.",
  {
    task_id: z.string().uuid(),
    completion_summary: z.string().min(1),
    acceptance_criteria_met: z.literal(true),
    expected_version: z.number().int(),
  },
  async (input) => {
    try {
      return json(
        await createApi().completeTask(input.task_id, {
          completionSummary: input.completion_summary,
          acceptanceCriteriaMet: input.acceptance_criteria_met,
          expectedVersion: input.expected_version,
        }),
      );
    } catch (error) {
      return fail(error);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
