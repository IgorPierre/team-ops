# Getting started

Team-Ops is three steps: run the board, give your coding agent a key, install
the skill — then the agent keeps the Kanban current.

## 1. Run the board

On a laptop or a VPS, the interactive installer is the quickest way:

```bash
npm create team-ops@latest my-team
```

It lets you pick the parts you want (board, AI agents, landing page), a
bundled or external PostgreSQL, the public URL and sign-up policy, writes
`.env`, and can start everything with Docker and load demo data.

Or by hand:

```bash
git clone https://github.com/IgorPierre/team-ops
cd team-ops
cp .env.example .env
docker compose up -d
```

Open http://localhost:3000 (or `https://your-host` behind TLS). The first
account on a new instance becomes the operator. After that, the instance is
invite-only: **People → Create invite**, share the link. Teammates join with
the role you picked (`admin`, `developer`, or `viewer`).

Agents never sign up. A developer connects their editor and approves it in the
browser; the agent then acts on their behalf.

The onboarding wizard creates your first organization and project.

Optional sample boards: `make docker-seed` (running stack) or `make db-seed` (dev checkout). Seeded logins
are `alex@example.com` / `password123`. Set `REGISTRATION_OPEN=true` only
if you want anyone who can reach the URL to create their own account.

External Postgres: [deployment](../deployment/external-postgres.md).

## 2. Connect a coding agent (OAuth)

Your instance hosts an MCP server at `<APP_URL>/mcp`. Each developer adds it to
their editor and signs in with their Team-Ops account — there are no keys:

```bash
# Claude Code (add --scope user for every repo)
claude mcp add --transport http team-ops https://ops.acme.dev/mcp
# then in Claude Code: /mcp → team-ops → Authenticate → Allow in the browser
```

Cursor (`.cursor/mcp.json`) and VS Code (`.vscode/mcp.json`) snippets are in
**Settings → Agents**. The editor registers itself, opens the consent screen,
and receives tokens that act as an agent owned by the developer, in the
organization they pick. Cards it opens are assigned to them. **Disconnect** in
Settings → Agents signs the editor out immediately; viewers can't connect agents.

## 3. Setup CLI (optional, recommended)

In the **repo where you code**:

```bash
npx @team-ops/setup --url https://ops.acme.dev
```

It will:

- write the MCP config for Claude Code (`.mcp.json`), Cursor (`.cursor/mcp.json`)
  or VS Code (`.vscode/mcp.json`) — just the URL, nothing secret
- install the Team-Ops skill (`.claude/skills`, `.cursor/skills` or `.github/skills`)
- write `.team-ops.json` with the board project key (`--project-key API`), or leave
  it for the agent to ask

Commit all three so teammates only have to sign in. Restart the editor.

### Options

```bash
npx @team-ops/setup -y --claude --url https://ops.acme.dev --project-key API
npx @team-ops/setup --global            # every repo on this machine
npx @team-ops/setup --check --url https://ops.acme.dev
```

### Manual install

See [MCP](../mcp/README.md) for hand-edited config and
[skills/team-ops/SKILL.md](../../skills/team-ops/SKILL.md) if you prefer to
copy the skill yourself.

From this clone, without npm publish:

```bash
npm install
npm run build -w @team-ops/setup
node apps/setup/dist/index.js --yes --url http://localhost:3000
```

## 4. Use it

Ask the agent to pick up a card. It should move the task to In Progress,
write progress as it works, and complete the card when the change is done.
The rest of the team sees that on the board — no extra tool.

With `autoUpdate: true` in `.team-ops.json`, the skill tells the agent to
update the board at each milestone without being asked every time.
