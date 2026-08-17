# ADR 0001 — Single Go API in front of PostgreSQL

Status: accepted

Team-Ops does not offer a Supabase-or-Go switch. Supabase (and Neon, RDS,
Cloud SQL) is a PostgreSQL host. All product rules live in the Go API so
MCP, the web app, and future clients share one contract (`openapi.yaml`).
