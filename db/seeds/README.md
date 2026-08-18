Seed data is applied with `make db-seed` (Go program in `apps/api/cmd/seed`).

It is idempotent for users, orgs, projects, the demo agent, and tasks (matched by title).
Re-running adds only cards that are missing.

Demo login: `alex@example.com` / `password123`

Open **Northwind Labs → ERP** first. That board has cards in every column, a blocked task, and a mix of human and agent activity.
