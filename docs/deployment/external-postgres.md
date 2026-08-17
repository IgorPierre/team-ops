# External PostgreSQL

Set `DATABASE_URL` to any Postgres 15+ instance:

```env
DATABASE_URL=postgres://user:pass@host:5432/teamops?sslmode=require
```

Then skip the bundled database:

```bash
docker compose -f docker-compose.yml -f deploy/examples/docker-compose.external-db.yml up -d
```

The API still owns all product rules. Supabase, Neon, RDS, Cloud SQL, and
similar products are PostgreSQL hosts, not alternate backends.
