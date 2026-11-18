import type { Interface } from "node:readline/promises";

import { openPrompt, parseArgs, promptMissing } from "./cli.js";
import { baseUrl, checkServer, mcpUrl, normalizeProjectKey } from "./discover.js";
import { copyBundledSkill, readJsonFile, writeJsonFile } from "./fs.js";
import { mergeMcpConfig } from "./mcp.js";
import { mcpTarget, skillDir, teamOpsConfigPath } from "./paths.js";
import type { SetupOptions, TeamOpsConfig } from "./types.js";

const SIGN_IN: Record<SetupOptions["editor"], string> = {
  claude: "In Claude Code run /mcp, pick team-ops and choose Authenticate.",
  cursor: "In Cursor Settings → MCP, use the sign-in prompt next to team-ops.",
  vscode: "In VS Code, start team-ops from .vscode/mcp.json (or MCP: List Servers) and sign in.",
};

export async function runSetup(argv: string[]) {
  const parsed = parseArgs(argv);
  const interactive = !parsed.yes && Boolean(process.stdin.isTTY);
  const rl: Interface | null = interactive ? openPrompt() : null;
  try {
    const options = rl ? await promptMissing(parsed, rl) : parsed;
    if (!options.url) options.url = "http://localhost:3000";
    await setup(options);
  } finally {
    rl?.close();
  }
}

async function setup(options: SetupOptions) {
  const url = baseUrl(options.url);
  const server = await checkServer(url);
  console.log(`✓ Team-Ops at ${url} — MCP endpoint ${server.resource}`);
  if (options.checkOnly) return;

  const projectKey = normalizeProjectKey(options.projectKey);

  if (!options.skipMcp) {
    const target = mcpTarget(options.editor, options.scope, options.cwd);
    mergeMcpConfig(target.path, mcpUrl(url), target.format);
    console.log(`✓ Added the team-ops MCP server → ${target.path}`);
  }

  if (!options.skipSkill) {
    const target = skillDir(options.editor, options.scope, options.cwd);
    copyBundledSkill(target);
    console.log(`✓ Installed the Team-Ops skill → ${target}/SKILL.md`);
  }

  if (!options.skipConfig) {
    const configPath = teamOpsConfigPath(options.cwd);
    const previous = readJsonFile<TeamOpsConfig>(configPath);
    const config: TeamOpsConfig = {
      url,
      projectKey: projectKey ?? previous?.projectKey,
      autoUpdate: previous?.autoUpdate ?? true,
    };
    writeJsonFile(configPath, config);
    console.log(
      config.projectKey
        ? `✓ Linked this repo to project ${config.projectKey} → ${configPath}`
        : `✓ Wrote ${configPath} — the agent will ask which project this repo belongs to`,
    );
  }

  console.log("");
  console.log("Next steps:");
  console.log("  1. Restart your editor so it loads the server and the skill.");
  console.log(`  2. ${SIGN_IN[options.editor]} Your browser opens Team-Ops — click Allow.`);
  console.log("  3. Code as usual; the agent opens, moves and closes cards for you.");
  if (options.scope === "project") {
    console.log("");
    console.log("Nothing here is secret — commit the MCP config, the skill and .team-ops.json so");
    console.log("teammates only have to sign in.");
  }
}
