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
git clone https://github.com/team-ops/team-ops
cd team-ops
cp .env.example .env
docker compose up -d
```

Open http://localhost:3000 and create an account. Demo data (optional):

```bash
docker compose exec api /app/server   # API already migrated on boot
# From a dev checkout:
make db-up db-migrate db-seed
```

Seed login after `make db-seed`: `alex@example.com` / `password123`

Connect an agent
----------------

1. In the web app, open **Agents** and create an agent + API key.
2. Configure MCP:

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

Ask the agent to pick up a task. Watch the board move.

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

License
-------

MIT
