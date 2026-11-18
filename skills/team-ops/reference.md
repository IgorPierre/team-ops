# Team-Ops skill reference

## Install (for humans)

The MCP server is hosted by your Team-Ops at `<url>/mcp`. Add it to your editor
and sign in with your Team-Ops account in the browser — there is no key to copy:

```bash
claude mcp add --transport http team-ops https://ops.acme.dev/mcp   # then /mcp → Authenticate
```

or, for Claude Code, Cursor or VS Code (also installs this skill and writes
`.team-ops.json`):

```bash
npx @team-ops/setup --url https://ops.acme.dev
```

Settings → Agents in the web app shows the snippet for each editor, who is
connected, and lets you disconnect an editor (it is signed out immediately).

## `.team-ops.json`

Commit it — it has no secrets — so every teammate's agent reports to the same
project. The MCP config files have no secrets either.

| Field | Purpose |
|-------|---------|
| `url` | Team-Ops URL people open |
| `projectKey` | Board project for this repo; pass as `project_key` |
| `autoUpdate` | When `true`, update the board at each milestone without being asked |

## MCP tools

| Tool | Use |
|------|-----|
| `team_ops_list_organizations` | Organizations this connection can see (normally the one chosen at sign-in) |
| `team_ops_list_projects` | Project keys and names |
| `team_ops_list_tasks` | Find backlog; `search` matches a key (`API-142`), title, description or external_ref |
| `team_ops_get_task` | Refresh version before a move |
| `team_ops_upsert_task` | Create or update by `external_ref` / title; `status` also moves an existing card |
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
6. `team_ops_complete_task` when merged/shipped, with `proof_kind` + `proof_url` (the PR, deploy…) or `proof_kind: "none"` for work with nothing to link.

## Example: new branch work

```text
team_ops_upsert_task
  project_key: API            # from .team-ops.json
  title: Add session refresh middleware
  external_ref: feat/session-refresh
  status: in_progress
```

Use the same `external_ref` on later updates so the card is not duplicated.
