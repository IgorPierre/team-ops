---
name: team-ops
description: >-
  Keeps the Team-Ops Kanban current while coding. Auto-invoke when starting
  work, committing, opening PRs, or finishing tasks. Use when Team-Ops MCP is
  configured, when `.team-ops.json` exists, or when the user mentions Team-Ops,
  the board, or a task key like ERP-142.
---

# Team-Ops board

You are a coding agent with a Team-Ops MCP server. The board is the source of
truth. Do the work **and** update the card. Do not wait for a standup.

MCP tools talk to the Team-Ops HTTP API only. They never touch PostgreSQL.

## Project config

If `.team-ops.json` exists in the repo root, read it first:

```json
{
  "url": "http://localhost:8080",
  "organizationId": "uuid",
  "projectId": "uuid",
  "projectKey": "ERP",
  "autoUpdate": true
}
```

When `autoUpdate` is `true`, update the board proactively at each milestone
below — do not wait for the user to ask.

If ids are missing, call `team_ops_list_organizations` and
`team_ops_list_projects`, then continue.

## When you start work

1. Resolve `organization_id` and `project_id` from `.team-ops.json` or MCP.
2. `team_ops_list_tasks` with `status=backlog` or search the key/title the user gave.
3. If no card exists and the user is starting new work, `team_ops_upsert_task`
   with a stable `external_ref` (branch name, issue id, or ticket key).
4. `team_ops_move_task` to `in_progress` with `expected_version` from the task.

## While you work

- After a meaningful step: `team_ops_report_progress` (summary, branch, commits, PR URL, tests, blockers).
- Blocked: `team_ops_block_task`. Unblocked: `team_ops_unblock_task`.
- Prefer `team_ops_upsert_task` with the same `external_ref` so you do not create duplicates.

## When you open a PR

`team_ops_request_review` with a summary and `pull_request_url`.

## When you are done

`team_ops_complete_task` with `completion_summary` and `acceptance_criteria_met: true`.

## Rules

- Always send `expected_version` from the last task payload. On `TASK_VERSION_CONFLICT`, fetch the task again and retry.
- Never invent column names. Only `backlog`, `in_progress`, `review`, `done`.
- Never skip the board because the code compiled.
- Task keys look like `ERP-142` (`projectKey-number`). Use search when the user mentions a key.

## More detail

See [reference.md](reference.md) for tool parameters and examples.
