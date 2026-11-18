# Publishing

Team-Ops ships three public npm packages:

| Package | Purpose |
|---------|---------|
| `@team-ops/mcp` | MCP stdio server (API adapter) |
| `@team-ops/setup` | Install skill + MCP config + `.team-ops.json` |
| `create-team-ops` | `npm create team-ops` — interactive instance scaffolder |

## Prerequisites

1. npm org `@team-ops` (create at https://www.npmjs.com/org/create)
2. `NPM_TOKEN` secret in GitHub repo settings (Automation token)
3. Git tag `v*` pushed to `main`

## Release flow

Pushing a version tag triggers [.github/workflows/release.yml](../../.github/workflows/release.yml):

1. Builds and pushes Docker images to `ghcr.io`
2. Publishes `@team-ops/mcp`
3. Publishes `@team-ops/setup`
4. Publishes `create-team-ops`

`create-team-ops` downloads the template from the git tag matching its own
version (`v<version>`, falling back to `main`), so bump `apps/create/package.json`
together with the tag.

```bash
# Bump versions in apps/mcp, apps/setup and apps/create package.json
git tag v0.1.0
git push origin v0.1.0
```

## Manual publish (first time)

```bash
npm install
npm run build -w @team-ops/mcp
npm run build -w @team-ops/setup
npm run build -w create-team-ops
npm publish --access public -w @team-ops/mcp
npm publish --access public -w @team-ops/setup
npm publish --access public -w create-team-ops
```

## Verify locally

```bash
make smoke-test
```

This boots Docker Compose, creates a user/org/project/agent, exercises the
API with an agent token, and runs `@team-ops/setup` in a temp directory.

## After publish

Users can run:

```bash
npm create team-ops@latest my-team   # new instance
npx @team-ops/setup
npx @team-ops/mcp   # started by MCP clients automatically
```

No clone required.
