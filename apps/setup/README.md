# Team-Ops setup

Install the Team-Ops agent skill, configure your editor's MCP connection and
link a coding repository to your team's self-hosted board.

```bash
npx @team-ops/setup@latest --url https://YOUR-TEAM-OPS
```

Run inside the repository where you code. The interactive installer supports
Claude Code, Cursor and VS Code. Restart your editor, then authenticate the
`team-ops` MCP server through your browser using your Team-Ops account.
No API key is needed for the hosted MCP connection.

```bash
# Configure Claude Code for a specific board project
npx @team-ops/setup@latest --url https://YOUR-TEAM-OPS --project-key API --claude

# Show all options
npx @team-ops/setup@latest --help
```

The package includes the skill and its reference. The skill guides the agent
to create tasks, update checklists, report progress and blockers, request review,
and record delivery evidence. Use `autoUpdate: false` in `.team-ops.json` if
board updates should happen only when requested.

Requires Node.js 20+ and a running Team-Ops instance. This installs the editor
integration; to create a new instance, use `npm create team-ops@latest my-team`.

[Source and documentation](https://github.com/IgorPierre/team-ops) · MIT
