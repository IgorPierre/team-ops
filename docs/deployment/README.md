# Deployment

Container images: `team-ops-api` and `team-ops-web`. MCP is published on npm.

```bash
docker compose up -d
```

## External Postgres

```bash
export DATABASE_URL=postgres://...
docker compose -f docker-compose.yml -f deploy/examples/docker-compose.external-db.yml up -d
```

## Backups

```bash
make backup
make restore FILE=backups/teamops-YYYYMMDD-HHMMSS.dump
```

These wrap `pg_dump` / `pg_restore`. There is no proprietary backup format.

## Network exposure

The bundled compose file publishes only what people and agents need:

| Service  | Port | Exposure |
|----------|------|----------|
| web      | 3000 | public (put TLS in front) — also proxies `/v1` and `/healthz` to the API |
| api      | 8080 | `127.0.0.1` only; set `API_BIND=0.0.0.0` to expose it |
| postgres | —    | not published; reach it with `docker compose exec postgres psql -U teamops` |

Set `POSTGRES_PASSWORD` in `.env` before the first start (`create-team-ops`
generates one). Coding agents use the same public URL as the browser.

## HTTPS

Terminate TLS at Caddy, nginx, Traefik, or your load balancer. Set
`COOKIE_SECURE=true` and `APP_URL=https://your.domain`.

## Vercel + Supabase

See [the deployment guide](vercel-supabase.md) for two Vercel projects (web and
Go API), the Supabase connection, migrations and first-account setup.
