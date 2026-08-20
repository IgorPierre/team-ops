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
git clone https://github.com/IgorPierre/team-ops
cd team-ops
cp .env.example .env
docker compose up -d
```

Open http://localhost:3000. The first account owns the instance; later
people join with an invite from **People**.

Connect an agent (3 steps)
--------------------------

1. In the web app: **Settings → Agents** → create an agent → copy the
   `tops_sk_…` secret (shown once).

2. In the repo you are coding in, install the skill + MCP config:

```bash
npx @team-ops/setup
```

3. Restart your coding agent (Cursor, Claude Code, etc.).

Ask the agent to pick up a backlog card or create one for your branch. The
board updates as it works.

One-liner check:

```bash
npx @team-ops/setup --check --url http://localhost:8080 --token tops_sk_...
```

Demo data (optional)
--------------------

```bash
make db-seed
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
