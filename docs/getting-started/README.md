# Getting started

1. Copy `.env.example` to `.env`.
2. `docker compose up -d` **or** `make dev` plus `make api-dev` and `npm run dev -w @team-ops/web`.
3. Open http://localhost:3000
4. Create an account, an organization, and a project.
5. Optional: `make db-seed` for Northwind / Atlas / Harbor sample boards.
6. Create an agent API key and point MCP at `TEAM_OPS_URL` + `TEAM_OPS_TOKEN`.
