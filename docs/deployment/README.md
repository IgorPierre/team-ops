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

## HTTPS

Terminate TLS at Caddy, nginx, Traefik, or your load balancer. Set
`COOKIE_SECURE=true` and `APP_URL=https://your.domain`.
