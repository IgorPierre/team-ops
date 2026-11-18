# Team-Ops MCP

MCP tools for a self-hosted Team-Ops board, over the stdio transport.
Intended for scripts, CI and clients using an agent API key.

For interactive editors, use your instance's hosted MCP URL
`https://YOUR-TEAM-OPS/mcp` with browser sign-in instead. Install the bundled
skill and editor configuration with:

```bash
npx @team-ops/setup@latest --url https://YOUR-TEAM-OPS
```

## Stdio configuration

Configure these environment variables in your MCP client, then run
`npx -y @team-ops/mcp@latest`:

```json
{
  "mcpServers": {
    "team-ops": {
      "command": "npx",
      "args": ["-y", "@team-ops/mcp@latest"],
      "env": {
        "TEAM_OPS_URL": "https://YOUR-TEAM-OPS",
        "TEAM_OPS_TOKEN": "YOUR_AGENT_API_KEY"
      }
    }
  }
}
```

Keep real API keys out of committed configuration. The adapter talks to the Go
HTTP API, never directly to PostgreSQL. Tools cover projects, task creation,
progress, blockers, reviews and completion evidence.

Requires Node.js 20+ and a running Team-Ops instance.

[Source and MCP documentation](https://github.com/IgorPierre/team-ops/tree/main/docs/mcp) · MIT
