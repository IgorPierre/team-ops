---
name: team-ops
description: >-
  Keeps the team's Team-Ops Kanban in sync with the coding work you do. Use it
  whenever you start, continue, or finish a coding task in a repo that has
  `.team-ops.json` or a `team-ops` MCP server — open or pick up a card, report
  progress, and close it with a summary, without being asked. Also use when the
  user mentions Team-Ops, the board, a card, or a task key like API-142.
---

# Team-Ops board

The team follows AI-assisted work on a shared Kanban instead of writing cards
by hand. **Every piece of work you do in this repo gets a card**, and the card
says what you did. Keep it current as you go — nobody will remind you.

The `team_ops_*` tools come from the Team-Ops MCP server, which the developer
signed in to with their Team-Ops account. Cards you create are assigned to them
automatically, and the organization is the one they picked when signing in.

## 1. Find the project

Read `.team-ops.json` in the repo root:

```json
{ "url": "https://ops.acme.dev", "projectKey": "API", "autoUpdate": true }
```

Pass its `projectKey` as `project_key` to the tools (no ids needed). If the
file or the key is missing, call `team_ops_list_projects`, ask the user which
project this repo belongs to, and save `projectKey` into `.team-ops.json`.

If a tool says the server needs authentication, tell the user to sign in
(Claude Code: `/mcp` → team-ops → Authenticate) and continue coding meanwhile.

`autoUpdate: true` (the default) means: update the board at each step below on
your own. If it is `false`, only touch the board when asked.

## 2. When you start a task

1. If the user named a card (`API-142`) or the work clearly continues one,
   `team_ops_list_tasks` with `search: "API-142"` (or a few title words).
2. Otherwise create one with `team_ops_upsert_task`:
   - `title`: short imperative outcome — "Add retry to Stripe webhooks", not "work on stripe".
   - `description`: the user's request and why, in 1–3 sentences.
   - `acceptance_criteria`: how we'll know it's done, as a markdown checklist
     (`- [ ] Webhook retries 3 times`, one check per line). The board shows it
     as a progress bar on the card.
   - `external_ref`: the branch name if there is one, else a stable slug like `fix/cart-rounding`.
     Re-using it later updates the same card instead of duplicating it.
   - `status: "in_progress"`, and `priority` if the user implied urgency.
3. If you picked up an existing card that isn't in progress, `team_ops_move_task`
   to `in_progress` (or pass `status` to `team_ops_upsert_task` — that moves it too,
   including reopening a done card).

Small follow-ups in the same session (a typo fix the user asks for right after)
belong on the current card; separate requests get their own card.

## 3. While you work

- When you finish a checklist item, tick it (`- [x]`) by sending the updated
  `acceptance_criteria` to `team_ops_upsert_task` (same `external_ref`).
- After a meaningful step (a commit, a passing test run, a design decision),
  `team_ops_report_progress` with a one-line `summary`, plus `branch`,
  `commit_shas`, `tests` when you have them.
- Stuck on something only a human can resolve: `team_ops_block_task` with the
  reason; `team_ops_unblock_task` when it's cleared.
- Opened a PR: `team_ops_request_review` with `summary` and `pull_request_url`.

## 4. When you finish

`team_ops_complete_task` with `acceptance_criteria_met: true` and a
`completion_summary` a manager can read without opening the code:

> Added exponential backoff (3 attempts, jitter) to Stripe webhook delivery in
> `billing/webhooks.go`; failed events go to a dead-letter table. Tests:
> `go test ./billing/...` passing. PR #48.

What changed, where, how it was verified, and any follow-up. If the work is
not actually done, report progress instead of completing.

Also say where the work can be checked — the board refuses to mark a card
done without it:

| `proof_kind` | `proof_url` |
| --- | --- |
| `github` | The PR or commit |
| `vercel` | The deploy or preview |
| `supabase` | The dashboard page of the migration, function or table |
| `other` | Any other link (doc, ticket, dashboard) |
| `none` | Leave out — only for work with nothing to link (planning, research) |

## Rules

- Always pass `expected_version` from the latest task payload. On
  `TASK_VERSION_CONFLICT`, `team_ops_get_task` and retry once.
- Statuses are `backlog`, `in_progress`, `review`, `done`, `production`. Use `production` only after the finished work is deployed. Blocked is a separate flag with a reason, displayed in its own board column.
- Never put secrets, tokens, customer data or full stack traces on a card.
- Don't create cards for pure questions or explanations with no code change.
- If a board call fails, tell the user in one line and keep coding — never
  block the actual work on the board.

See [reference.md](reference.md) for every tool and its parameters.
