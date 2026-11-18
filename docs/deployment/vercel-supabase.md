# Vercel + Supabase

Deploy two Vercel projects from this repository. The web project serves Next.js
and MCP; the API project runs the existing Go server. Supabase hosts Postgres.
Supabase Auth is not used: Team-Ops owns accounts, sessions and invitations.

## 1. Supabase

Create a new production project. In **Connect**, copy its **Session pooler**
connection string (port 5432). This supports the prepared statements used by
pgx and is reachable over IPv4. Use the exact hostname shown in the dashboard.

Append `?sslmode=require&pool_max_conns=3&pool_min_conns=0` (or append with `&`
if the URL already has a query). URL-encode reserved characters in the password.
Keep this URL in server-side environment variables only.

Disable the Supabase **Data API** for this project: Team-Ops accesses Postgres
through its Go API, and its application tables do not have Supabase RLS policies.
Do this before applying the migrations so the public Data API cannot expose
accounts, password hashes, sessions or OAuth data. Do not expose these tables
through Supabase REST/GraphQL without a separate RLS policy design.

Apply the migrations from a trusted terminal using the connection string in
`DATABASE_URL` (do not commit it). For migrations use the direct connection
recommended by Supabase; if your machine has no IPv6, use the session pooler.
Never use the transaction pooler for migration commands.

```bash
cd apps/api
# DATABASE_URL is set securely in this shell to the production connection URL.
go run ./cmd/migrate up
```

Do not run `db-seed`, `docker-seed` or the local demo SQL against production.

## 2. API project on Vercel

Import the repo with **Root Directory `apps/api`**, framework **Go**. The preset
finds `go.mod` and `cmd/server/main.go`; `apps/api/vercel.json` selects it.
Leave HTTP_ADDR unset so the process listens on Vercel's PORT.

Set these environment variables for Production:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase session pooler URL with SSL and pool settings above |
| `APP_URL` | Stable public URL of the web project, e.g. `https://ops.example.com` |
| `COOKIE_SECURE` | `true` |
| `REGISTRATION_OPEN` | `false` |
| `MIGRATE_ON_START` | `false` |

Migrations run separately before deploying schema changes. They are not included
in the API function and must not run on every cold start. Place the API close to
the Supabase region. After deployment, the API's `/healthz` must respond `ok`.

The web app and external MCP clients need to reach the API. If Vercel Deployment
Protection is enabled on a project, configure access appropriately before using
it as a production API; a Vercel login page is not a Team-Ops API response.

## 3. Web project on Vercel

Import the same repo with **Root Directory `apps/web`**, framework **Next.js**.
Enable **Include source files outside of the Root Directory in the Build Step**
for the shared workspace packages. Keep the monorepo dependency installation.

| Variable | Value |
| --- | --- |
| `API_URL` | Stable HTTPS URL of the API project; no trailing `/v1` |
| `APP_URL` | Stable HTTPS URL of this web project |
| `NEXT_PUBLIC_API_BASE` | `/v1` |

`API_URL` must be set at build time as well as runtime: Next.js builds rewrites
with it, while hosted MCP reads it at runtime. Redeploy after changing it.
Do not put DATABASE_URL, database passwords or Supabase service keys in any
NEXT_PUBLIC variable. No Supabase browser credentials are needed.

The web proxy provides `/v1`, `/healthz`, OAuth discovery and token routes on
one public origin, keeping session cookies first-party. MCP is at `/mcp`.
Use the same stable web URL for APP_URL on both projects, not preview URLs.

## 4. First launch

Open the production web `/register` and create your administrator account.
With REGISTRATION_OPEN=false the first account bootstraps the instance; after
that, other people join by invitation. Use a new empty database, not the local
demo database. Check login, a new project/task, blocked/production columns,
reports and an editor's OAuth connection to `/mcp`.

Preview deployments must use a separate database and their own APP_URL values;
do not point unreviewed preview code at the production database.

## References

- [Vercel Go runtime](https://vercel.com/docs/functions/runtimes/go)
- [Vercel monorepos](https://vercel.com/docs/monorepos)
- [Supabase Postgres connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
