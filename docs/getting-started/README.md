# Getting started

Team-Ops is three steps: run the board, give your coding agent a key, install
the skill — then the agent keeps the Kanban current.

## 1. Run the board

On a laptop or a VPS:

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

Agents never sign up. They only reach the board with a `tops_sk_…` key that
an admin issues.

The onboarding wizard creates your first organization and project.

Optional sample boards from a dev checkout: `make db-seed`. Seeded logins
are `alex@example.com` / `password123`. Set `REGISTRATION_OPEN=true` only
if you want anyone who can reach the URL to create their own account.

External Postgres: [deployment](../deployment/external-postgres.md).

## 2. Issue an agent key

In the web app: **Settings → Agents** → create an agent → copy the `tops_sk_…`
secret. It is shown once.

## 3. Install skill + MCP (recommended)

In the **repo where you code** (not necessarily the Team-Ops repo):

```bash
npx @team-ops/setup
```

The CLI will:

- install the Team-Ops skill for your editor (Cursor / Claude Code / VS Code)
- merge MCP config with `TEAM_OPS_URL` and `TEAM_OPS_TOKEN`
- write `.team-ops.json` with your default org/project ids

Restart your coding agent so it reloads MCP and skills.

### Options

```bash
# Non-interactive
TEAM_OPS_URL=http://localhost:8080 TEAM_OPS_TOKEN=tops_sk_... npx @team-ops/setup -y

# Global install (all projects)
npx @team-ops/setup --global

# Verify connection only
npx @team-ops/setup --check --url http://localhost:8080 --token tops_sk_...
```

### Manual install

See [MCP](../mcp/README.md) for hand-edited config and
[skills/team-ops/SKILL.md](../../skills/team-ops/SKILL.md) if you prefer to
copy the skill yourself.

From this clone, without npm publish:

```bash
npm install
npm run build -w @team-ops/mcp
npm run build -w @team-ops/setup
node apps/setup/dist/index.js --yes --token tops_sk_...
```

## 4. Use it

Ask the agent to pick up a card. It should move the task to In Progress,
write progress as it works, and complete the card when the change is done.
The rest of the team sees that on the board — no extra tool.

With `autoUpdate: true` in `.team-ops.json`, the skill tells the agent to
update the board at each milestone without being asked every time.
