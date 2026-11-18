# MCP

Team-Ops hosts its MCP server at **`<APP_URL>/mcp`** (Streamable HTTP). Editors
connect with OAuth: on the first request they get a `401` pointing at
`/.well-known/oauth-protected-resource/mcp`, discover the authorization server,
register themselves, and open the browser so the developer can sign in and
click **Allow**. There are no keys to copy or rotate.

```bash
claude mcp add --transport http team-ops https://ops.acme.dev/mcp
```

```jsonc
// .cursor/mcp.json
{ "mcpServers": { "team-ops": { "url": "https://ops.acme.dev/mcp" } } }

// .vscode/mcp.json
{ "servers": { "team-ops": { "type": "http", "url": "https://ops.acme.dev/mcp" } } }
```

Or let `npx @team-ops/setup --url https://ops.acme.dev` write it (plus the skill
and `.team-ops.json`). None of these files contain secrets.

## How the sign-in works

| Step | Endpoint |
|------|----------|
| Resource metadata (RFC 9728) | `GET /.well-known/oauth-protected-resource/mcp` |
| Authorization server metadata (RFC 8414) | `GET /.well-known/oauth-authorization-server` |
| Dynamic client registration (RFC 7591) | `POST /oauth/register` |
| Consent screen (browser, signed-in user) | `GET /oauth/authorize` |
| Code → tokens (PKCE S256), refresh rotation | `POST /oauth/token` |
| Revocation (RFC 7009) | `POST /oauth/revoke` |

Approving creates (or reuses) an agent owned by the developer in the
organization they chose. Access tokens (`tops_at_…`, 1 hour) and refresh tokens
(`tops_rt_…`, 60 days, single use) act as that agent: cards it creates are
assigned to the developer. Disconnecting the agent in **Settings → Agents**
revokes its tokens; so does demoting its owner to viewer.

The server also sends **instructions** on connect (open a card per task, report
progress, close it with a summary), so agents keep the board current even
without the skill files.

Tools accept `project_key` (e.g. `API`, from `.team-ops.json`) instead of ids;
the organization defaults to the one chosen at sign-in.

## stdio for scripts and CI

`@team-ops/mcp` is a stdio build of the same tools for non-interactive use. It
authenticates with an API key (`TEAM_OPS_TOKEN`, created through the API) and
should not be used for people's editors.

```env
TEAM_OPS_URL=https://ops.acme.dev
TEAM_OPS_TOKEN=tops_sk_xxxxx
```

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

Moving a card to done (complete, move or upsert with `status: "done"`) needs
proof of the work: `proof_kind` `github`, `vercel`, `supabase` or `other` with a
`proof_url`, or `none` for work with nothing to link (planning, research).
Without it the API answers `PROOF_REQUIRED`.

## Skill

Install with `@team-ops/setup`, or ship
[skills/team-ops/SKILL.md](../../skills/team-ops/SKILL.md) manually so the
agent updates the board without being asked every time.

Project defaults live in `.team-ops.json` — see
[examples/team-ops.json](../../examples/team-ops.json).
