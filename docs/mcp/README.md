# MCP

`@team-ops/mcp` is a stdio server. It calls the Team-Ops HTTP API. It does
not know about PostgreSQL, Docker, or cloud vendors.

The process runs next to the coding agent (Cursor, Claude Code, Copilot, …),
not inside the Team-Ops containers.

```env
TEAM_OPS_URL=http://localhost:8080
TEAM_OPS_TOKEN=tops_sk_xxxxx
```

`TEAM_OPS_URL` is the API origin with no `/v1` suffix.

## Config snippets

- Cursor: [examples/mcp/cursor.json](../../examples/mcp/cursor.json) → `.cursor/mcp.json`
- Claude Code: [examples/mcp/claude.json](../../examples/mcp/claude.json) → `.mcp.json`
- VS Code / Copilot: [examples/mcp/vscode.json](../../examples/mcp/vscode.json) → `.vscode/mcp.json`

## From this repository

```bash
npm install
npm run build -w @team-ops/mcp
node apps/mcp/dist/index.js
```

The published package bundles the API client. Runtime dependencies are only
`@modelcontextprotocol/sdk` and `zod`.

## Tools

`team_ops_list_organizations`, `team_ops_list_projects`,
`team_ops_list_tasks`, `team_ops_get_task`, `team_ops_upsert_task`,
`team_ops_move_task`, `team_ops_report_progress`, `team_ops_add_comment`,
`team_ops_block_task`, `team_ops_unblock_task`, `team_ops_request_review`,
`team_ops_complete_task`.

Upsert looks up `external_ref`, then title, before creating a row. Moves and
progress require `expected_version`.

## Skill

Ship [skills/team-ops/SKILL.md](../../skills/team-ops/SKILL.md) with the
agent so it updates the board without being asked every time.
