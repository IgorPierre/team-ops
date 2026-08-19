# Public launch checklist

Use this before making the GitHub repo public.

## Product readiness

- [x] Docker Compose boots API + web + Postgres
- [x] First-user registration + onboarding flow
- [x] Agent API keys (`tops_sk_…`) + MCP tools
- [x] `@team-ops/setup` CLI (skill + MCP + `.team-ops.json`)
- [x] Smoke test script (`make smoke-test`)
- [x] CI (API tests + web + MCP + setup + website build)

## One-time maintainer setup

1. **npm org** — create `@team-ops` at https://www.npmjs.com/org/create
2. **GitHub secret** — add `NPM_TOKEN` (Automation) to repo secrets
3. **Publish packages** — either:
   - push tag `v0.1.0` (triggers release workflow), or
   - run manually: see [docs/publishing](../publishing/README.md)

## Verify locally

```bash
docker compose up -d
make smoke-test
```

## User journey (after npm publish)

```bash
# 1. Host Team-Ops
git clone https://github.com/YOUR_ORG/team-ops
cd team-ops && cp .env.example .env && docker compose up -d

# 2. Open http://localhost:3000 → register → onboarding → Settings → Agents → copy tops_sk_…

# 3. In the coding repo
npx @team-ops/setup

# 4. Restart Cursor / Claude Code → ask agent to pick up a card
```

## GitHub repo settings

- Set description + topics: `kanban`, `mcp`, `self-hosted`, `postgresql`, `agents`
- Enable Issues / Discussions if you want community feedback
- Add LICENSE (MIT — already in repo)

## Optional post-launch

- Deploy website (`apps/website`) to Vercel
- Publish Docker images to GHCR (release workflow already configured)
- Demo video or GIF in README
