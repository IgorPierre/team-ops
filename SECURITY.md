# Security Policy

## Reporting a vulnerability

Email maintainers privately. Do not open a public issue for a working
exploit. We will acknowledge receipt and work on a fix before any
disclosure.

## What this software stores

Team-Ops is self-hosted. You hold the database, backups, and API keys.

- Passwords are hashed with Argon2id. Plaintext passwords are never stored.
- API keys (`tops_sk_…`) are shown once and stored as SHA-256 hashes plus a
  display prefix. Treat a leaked key as a credential.
- Session cookies are HTTP-only.
- Logs must not include passwords, full API keys, `DATABASE_URL` values, or
  session tokens.

## Deployment expectations

- Put TLS in front (Caddy, nginx, Traefik, or a cloud load balancer).
- Restrict PostgreSQL to the API network.
- Rotate `DATABASE_URL` credentials independently of application deploys.
- Use `make backup` / `pg_dump` on a schedule you control.
- Issue agent keys with the minimum scopes.

See [docs/security](docs/security/README.md).
