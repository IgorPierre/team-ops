# Team-Ops skill reference

## Install (for humans)

From the repo you are coding in:

```bash
npx @team-ops/setup
```

Provide your `tops_sk_…` key from **Settings → Agents** in the Team-Ops web app.

## `.team-ops.json`

Written by `@team-ops/setup`. Safe to commit (no secrets — the token lives in MCP config).

| Field | Purpose |
|-------|---------|
| `url` | API origin, no `/v1` |
| `organizationId` | Default org for upserts |
| `projectId` | Default project for upserts |
| `projectKey` | Prefix for human-readable keys (`ERP-142`) |
| `autoUpdate` | When `true`, update the board at each milestone without being asked |

## MCP tools

| Tool | Use |
|------|-----|
| `team_ops_list_organizations` | Discover org id |
| `team_ops_list_projects` | Discover project id |
| `team_ops_list_tasks` | Find backlog / search by key |
| `team_ops_get_task` | Refresh version before a move |
| `team_ops_upsert_task` | Create or update by `external_ref` / title |
| `team_ops_move_task` | Change column |
| `team_ops_report_progress` | Mid-work update |
| `team_ops_request_review` | PR opened |
| `team_ops_complete_task` | Work finished |
| `team_ops_add_comment` | Note on the card |
| `team_ops_block_task` / `team_ops_unblock_task` | Blockers |

## Example: pick up ERP-142

1. `team_ops_list_tasks` with `search: "ERP-142"` or `external_ref`.
2. `team_ops_move_task` → `in_progress`, `expected_version` from step 1.
3. Code.
4. `team_ops_report_progress` after each meaningful commit.
5. `team_ops_request_review` when the PR is open.
6. `team_ops_complete_task` when merged/shipped.

## Example: new branch work

```text
team_ops_upsert_task
  organization_id: <from .team-ops.json>
  project_id: <from .team-ops.json>
  title: Add session refresh middleware
  external_ref: feat/session-refresh
  status: in_progress
```

Use the same `external_ref` on later updates so the card is not duplicated.
