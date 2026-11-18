# Create Team-Ops

Create a self-hosted engineering board for people and coding agents.

```bash
npm create team-ops@latest my-team
```

The installer asks what to include:

- **Board + API:** always included.
- **AI agents:** MCP tooling, the agent skill and editor setup CLI.
- **Landing page:** optional marketing site in `apps/website`.

Choose bundled Docker PostgreSQL or your own database, set the public URL and
registration policy, and optionally install dependencies, initialize Git and
start the Docker stack. Demo data is optional and intended for local use.

```bash
# Without the landing page
npm create team-ops@latest my-team -- --no-website

# With the landing page
npm create team-ops@latest my-team -- --website

# Show all options
npx create-team-ops@latest --help
```

The landing page is separate from the web app. Including it copies its source;
it does not automatically deploy it to a public host.

Requires Node.js 20+. Git and Docker Compose are needed for the corresponding
setup and startup steps. Your machine needs Internet access to fetch the
repository template and install dependencies.

Already have a Team-Ops instance? Connect your coding repository using
`npx @team-ops/setup@latest --url https://YOUR-TEAM-OPS`.

[Source and deployment guide](https://github.com/IgorPierre/team-ops) · MIT
