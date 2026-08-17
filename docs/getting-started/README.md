# Getting started

Team-Ops is three steps: run the board, give your coding agent a key, let it
keep the Kanban current.

## 1. Run the board

On a laptop or a VPS:

```bash
git clone https://github.com/team-ops/team-ops
cd team-ops
cp .env.example .env
docker compose up -d
```

Open http://localhost:3000 (or `https://your-host` behind TLS). The first
account on a new instance becomes the operator. After that, the instance is
invite-only: **People → Create invite**, share the link. Teammates join with
the role you picked (`admin`, `developer`, or `viewer`).

Agents never sign up. They only reach the board with a `tops_sk_…` key that
an admin issues.

Optional sample boards from a dev checkout: `make db-seed`. Seeded logins
are `alex@example.com` / `password123`. Set `REGISTRATION_OPEN=true` only
if you want anyone who can reach the URL to create their own account.

External Postgres: [deployment](../deployment/external-postgres.md).

## 2. Issue an agent key

In the web app: **Agents** → create an agent → copy the `tops_sk_…` secret.
It is shown once.

## 3. Point the coding agent at Team-Ops

The MCP process runs **on the machine where the agent runs** (your laptop).
It calls the HTTP API. It never talks to PostgreSQL.

### MCP

Copy [examples/mcp/cursor.json](../../examples/mcp/cursor.json) into
`.cursor/mcp.json` (Cursor), `.mcp.json` (Claude Code), or
`.vscode/mcp.json` (GitHub Copilot). Set:

- `TEAM_OPS_URL` — API origin, no `/v1`. Local Docker: `http://localhost:8080`. Remote: `https://teamops.example.com`.
- `TEAM_OPS_TOKEN` — the `tops_sk_…` key.

```json
{
  "mcpServers": {
    "team-ops": {
      "command": "npx",
      "args": ["-y", "@team-ops/mcp"],
      "env": {
        "TEAM_OPS_URL": "http://localhost:8080",
        "TEAM_OPS_TOKEN": "tops_sk_..."
      }
    }
  }
}
```

From this clone, without npm publish:

```bash
npm install
npm run build -w @team-ops/mcp
```

Then use `"command": "node"` and
`"args": ["/absolute/path/to/team-ops/apps/mcp/dist/index.js"]`.

### Skill

Copy [skills/team-ops/SKILL.md](../../skills/team-ops/SKILL.md) into the repo
you are coding in:

- Cursor: `.cursor/skills/team-ops/SKILL.md`
- Claude Code: `.claude/skills/team-ops/SKILL.md`

Or install it once for all projects: `~/.cursor/skills/team-ops/SKILL.md`.

## 4. Use it

Ask the agent to pick up a card. It should move the task to In Progress,
write progress as it works, and complete the card when the change is done.
The rest of the team sees that on the board — no extra tool.
