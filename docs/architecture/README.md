# Architecture

Team-Ops is a single Go API in front of PostgreSQL. The web app and the MCP
server are clients. Neither talks to the database.

```
Team-Ops Web ──┐
               ├──► Team-Ops API ──► PostgreSQL
Team-Ops MCP ──┘
```

## Actor model

Every mutating request carries an `Actor` (`user`, `agent`, or `system`).
Task activities record who did what. Agents authenticate with hashed API
keys and scopes. Users authenticate with Argon2id passwords and sessions.

## Concurrency

Tasks have a `version` column. Updates send `expectedVersion`. A mismatch
returns `TASK_VERSION_CONFLICT`. The board rolls back the optimistic move.

## Positions

`position` is numeric. Inserts use midpoints (`1000`, `1500`, `2000`). A
column is renormalized only when two neighbors get too close.

See [ADR 0001](adr-0001-single-go-api.md).
