import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync } from "node:fs";

import type { Editor, Scope, SetupOptions } from "./types.js";

function parseEditor(value: string | undefined): Editor | undefined {
  if (value === "cursor" || value === "claude" || value === "vscode") return value;
  return undefined;
}

function detectEditor(cwd: string): Editor {
  if (existsSync(`${cwd}/.cursor`)) return "cursor";
  if (existsSync(`${cwd}/.claude`)) return "claude";
  if (existsSync(`${cwd}/.vscode`)) return "vscode";
  return "cursor";
}

export function parseArgs(argv: string[]): SetupOptions {
  const opts: SetupOptions = {
    cwd: process.cwd(),
    editor: detectEditor(process.cwd()),
    scope: "project",
    url: process.env.TEAM_OPS_URL ?? "http://localhost:8080",
    token: process.env.TEAM_OPS_TOKEN ?? "",
    checkOnly: false,
    yes: false,
    skipSkill: false,
    skipMcp: false,
    skipConfig: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--check") opts.checkOnly = true;
    if (arg === "--yes" || arg === "-y") opts.yes = true;
    if (arg === "--project") opts.scope = "project";
    if (arg === "--global") opts.scope = "global";
    if (arg === "--cursor") opts.editor = "cursor";
    if (arg === "--claude") opts.editor = "claude";
    if (arg === "--vscode") opts.editor = "vscode";
    if (arg === "--skip-skill") opts.skipSkill = true;
    if (arg === "--skip-mcp") opts.skipMcp = true;
    if (arg === "--skip-config") opts.skipConfig = true;
    if (arg === "--cwd" && argv[i + 1]) opts.cwd = argv[++i];
    if (arg === "--url" && argv[i + 1]) opts.url = argv[++i];
    if (arg === "--token" && argv[i + 1]) opts.token = argv[++i];
    if (arg.startsWith("--editor=")) {
      const editor = parseEditor(arg.split("=", 2)[1]);
      if (editor) opts.editor = editor;
    }
  }

  return opts;
}

export async function promptMissing(options: SetupOptions): Promise<SetupOptions> {
  if (options.yes) return options;
  const rl = createInterface({ input, output });
  try {
    if (!options.token) {
      options.token = (
        await rl.question("Team-Ops API token (tops_sk_… from Settings → Agents): ")
      ).trim();
    }
    if (!options.url) {
      options.url = (await rl.question("Team-Ops URL [http://localhost:8080]: ")).trim();
    }
    if (!options.url) options.url = "http://localhost:8080";

    if (!process.argv.includes("--cursor") && !process.argv.includes("--claude") && !process.argv.includes("--vscode")) {
      const editor = (await rl.question(`Editor [${options.editor}]: `)).trim();
      const parsed = parseEditor(editor);
      if (parsed) options.editor = parsed;
    }

    if (!process.argv.includes("--project") && !process.argv.includes("--global")) {
      const scope = (await rl.question("Install scope (project/global) [project]: ")).trim();
      if (scope === "global") options.scope = "global";
    }
  } finally {
    rl.close();
  }
  return options;
}

function printHelp() {
  console.log(`team-ops-setup — install Team-Ops skill + MCP config

Usage:
  npx @team-ops/setup [options]

Options:
  --url <url>        Team-Ops API origin (default: http://localhost:8080)
  --token <token>    tops_sk_… agent API key
  --cursor           Target Cursor (.cursor/)
  --claude           Target Claude Code (.claude/ or .mcp.json)
  --vscode           Target VS Code / Copilot (.vscode/mcp.json)
  --project          Install into the current repo (default)
  --global           Install into your home directory
  --cwd <dir>        Working directory (default: process.cwd())
  --check            Verify URL + token, then exit
  --yes, -y          Skip prompts (requires --token or TEAM_OPS_TOKEN)
  --skip-skill       Only write MCP + .team-ops.json
  --skip-mcp         Only install the skill
  --skip-config      Skip .team-ops.json
  -h, --help         Show this help

Environment:
  TEAM_OPS_URL       Default API origin
  TEAM_OPS_TOKEN     Default agent token

Examples:
  npx @team-ops/setup
  npx @team-ops/setup --url https://teamops.example.com --token tops_sk_...
  npx @team-ops/setup --check --url http://localhost:8080 --token tops_sk_...
`);
}
