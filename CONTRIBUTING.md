# Contributing to Team-Ops

## Dev loop

```bash
cp .env.example .env
make dev
make db-migrate
make db-seed
# terminal A
make api-dev
# terminal B
npm install
npm run dev -w @team-ops/web
```

Web: http://localhost:3000  
API: http://localhost:8080

## Checks

```bash
make lint
make test
make build
```

## Layout

- `apps/api` — Go HTTP API
- `apps/web` — Next.js board
- `apps/mcp` — MCP adapter (no business rules)
- `apps/website` — public landing
- `db` — Goose migrations + sqlc queries
- `openapi/openapi.yaml` — API contract

Pull requests should stay small. Match the existing style. Do not add
message buses, custom workflow engines, or extra column types in V1.

The product loop is: run the board → issue an agent key → MCP + skill in
the coding agent → the Kanban stays current. See `docs/getting-started`.
