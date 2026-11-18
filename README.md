Team-Ops
========

The self-hosted engineering board for humans and AI agents.

[Open Source] [Self Hosted] [PostgreSQL] [MCP] [Docker]

Team-Ops is a Kanban hub for engineering teams. Humans use a visual board.
AI agents use the HTTP API and MCP to create, move, and document work. You
install it on your own infrastructure. There is no required Team-Ops cloud.

Why it exists
-------------

Coding agents already write the code. The board still lags behind. Team-Ops
gives agents a first-class API (optimistic concurrency, idempotent
`external_ref`, activity history) and keeps the UI simple on purpose.

Quick start
-----------

```bash
npm create team-ops@latest my-team
```

The installer asks what you want (board, AI agents, landing page), which
database to use (bundled Postgres or your own), the public URL and who can
sign up, then installs dependencies, initializes git and, if Docker is
running, builds and starts everything — optionally with demo data.

Skip the questions with flags, e.g.
`npm create team-ops@latest my-team -- --yes --no-website --start --seed`.
See `npx create-team-ops --help` for all of them.

Prefer to do it by hand:

```bash
git clone https://github.com/IgorPierre/team-ops
cd team-ops
cp .env.example .env
docker compose up -d
```

Open http://localhost:3000. The first account owns the instance; later
people join with an invite from **People**.

How a team uses it
------------------

1. **Host it once** for the team (`npm create team-ops`, or Docker on any
   server). Invite people from **People**: developers write the board,
   viewers (managers, stakeholders) follow it.
2. **Each developer connects their coding agent** — Claude Code, Cursor or
   VS Code — to the MCP server your instance hosts at `/mcp`, and signs in
   with their Team-Ops account in the browser (OAuth). No keys to copy:

   ```bash
   claude mcp add --transport http team-ops https://ops.your-company.dev/mcp
   # then /mcp → team-ops → Authenticate → Allow
   ```

   Or run `npx @team-ops/setup --url https://ops.your-company.dev` in the repo:
   it writes the MCP config for Claude Code, Cursor or VS Code, installs the
   Team-Ops skill and links the repo to a board project in `.team-ops.json`.
   None of it is secret, so commit it — teammates then only have to sign in.
   **Settings → Agents** shows the snippet for each editor and who is
   connected, and disconnects an editor instantly.
3. **Work as usual.** The skill makes the agent open a card for each task,
   move it as it goes, and close it with a summary of what changed. Cards are
   assigned to the developer who owns the agent, so nobody writes cards by hand.
4. **Managers follow along** on the Board, Timeline, People pages and
   **Reports**.

Agents use the same URL people open. The MCP server also tells the agent how
to keep the board current, so it works even before the skill is installed.
For scripts and CI there is still a stdio binary (`npx @team-ops/mcp`) that
takes an API key from `TEAM_OPS_TOKEN`.

Timeline, people and reports
----------------------------

- **Timeline** shows every task on an animated timeline. Filter by person
  (or unassigned), project and status; order by schedule or by latest
  update. Filters live in the URL, so a filtered view can be shared.
- **People → a name** opens that person's page: open/in-flight/shipped/
  overdue counts, a year of board activity as a heat map that folds into a
  3D skyline (optionally including their agents' work), and their assigned
  tasks on a timeline.
- **Reports** summarizes a period (7/30/90 days, 12 months or custom):
  completed vs created, share done by AI agents, cycle time (start → done),
  blocked and overdue work, a weekly chart, breakdowns by person and project,
  and the list of delivered cards with their completion summaries. Filter by
  person and project; export tasks or the per-person table as CSV.

Demo data (optional)
--------------------

```bash
make db-seed       # from a dev checkout (needs Go)
make docker-seed   # into the running Docker stack
```

Seed login: `alex@example.com` / `password123` (Northwind Labs → ERP).

Manual MCP config
-----------------

If you prefer not to use the setup CLI, see [docs/mcp](docs/mcp/README.md).

External PostgreSQL
-------------------

Set `DATABASE_URL` to any Postgres 15+ instance (RDS, Cloud SQL, Neon,
Supabase, Railway, …). Disable the bundled database:

```bash
docker compose -f docker-compose.yml -f deploy/examples/docker-compose.external-db.yml up -d
```

Docs
----

- [Getting started](docs/getting-started/README.md)
- [Architecture](docs/architecture/README.md)
- [API](docs/api/README.md)
- [MCP](docs/mcp/README.md)
- [Deployment](docs/deployment/README.md)
- [Security](docs/security/README.md)
- [Publishing npm packages](docs/publishing/README.md) (maintainers)

Verify before release
---------------------

```bash
make smoke-test
```

License
-------

MIT
