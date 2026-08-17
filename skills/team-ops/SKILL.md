---
name: team-ops
description: >-
  Keeps the Team-Ops Kanban current while coding. Use when starting work, moving
  a card, reporting progress, opening a PR, finishing a task, or when the user
  mentions Team-Ops, the board, or a task key like ERP-142.
---

# Team-Ops board

You are a coding agent with a Team-Ops MCP server. The board is the source of
truth. Do the work **and** update the card. Do not wait for a standup.

MCP tools talk to the Team-Ops HTTP API only. They never touch PostgreSQL.

## When you start work

1. `team_ops_list_organizations` then `team_ops_list_projects` if you do not already know the ids.
2. `team_ops_list_tasks` (filter `status=backlog` or search the key/title).
3. `team_ops_move_task` to `in_progress` with `expected_version` from the task payload.

## While you work

- After a meaningful step: `team_ops_report_progress` (summary, branch, commits, PR URL, tests, blockers).
- Blocked: `team_ops_block_task`. Unblocked: `team_ops_unblock_task`.
- Prefer `team_ops_upsert_task` with a stable `external_ref` (branch name or issue id) so you do not create duplicates.

## When you open a PR

`team_ops_request_review` with a summary and `pull_request_url`.

## When you are done

`team_ops_complete_task` with `completion_summary` and `acceptance_criteria_met: true`.

## Rules

- Always send `expected_version` from the last task payload. On `TASK_VERSION_CONFLICT`, get the task again and retry.
- Never invent column names. Only `backlog`, `in_progress`, `review`, `done`.
- Never skip the board because the code compiled.
