import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { parseArgs, promptMissing } from "./cli.js";
import { checkConnection, discoverWorkspace } from "./discover.js";
import { copyBundledSkill, writeJsonFile } from "./fs.js";
import { mergeMcpConfig } from "./mcp.js";
import { mcpConfigPath, skillDir, teamOpsConfigPath } from "./paths.js";
import type { TeamOpsConfig } from "./types.js";

function localMcpPath(cwd: string) {
  const candidate = resolve(cwd, "apps/mcp/dist/index.js");
  return existsSync(candidate) ? candidate : undefined;
}

export async function runSetup(argv: string[]) {
  const options = await promptMissing(parseArgs(argv));

  if (!options.token) {
    throw new Error("An agent API token is required. Create one in the web app under Settings → Agents.");
  }

  await checkConnection(options.url, options.token);
  console.log("✓ Connected to Team-Ops API");

  if (options.checkOnly) {
    console.log("Connection OK.");
    return;
  }

  const discovered = options.skipConfig ? null : await discoverWorkspace(options.url, options.token);
  const useLocalMcp = Boolean(localMcpPath(options.cwd));

  if (!options.skipSkill) {
    const target = skillDir(options.editor, options.scope, options.cwd);
    copyBundledSkill(target);
    console.log(`✓ Installed skill → ${target}/SKILL.md`);
  }

  if (!options.skipMcp) {
    const mcpPath = mcpConfigPath(options.editor, options.scope, options.cwd);
    mergeMcpConfig(
      mcpPath,
      options.url,
      options.token,
      useLocalMcp,
      localMcpPath(options.cwd),
    );
    console.log(`✓ Updated MCP config → ${mcpPath}`);
    if (options.editor === "vscode") {
      console.log("  Note: VS Code uses MCP only. Copy the skill manually if your agent supports it.");
    }
  }

  if (!options.skipConfig) {
    const config: TeamOpsConfig = {
      url: options.url.replace(/\/$/, ""),
      autoUpdate: true,
      organizationId: discovered?.organizationId,
      organizationName: discovered?.organizationName,
      projectId: discovered?.projectId,
      projectKey: discovered?.projectKey,
      projectName: discovered?.projectName,
    };
    const configPath = teamOpsConfigPath(options.cwd);
    writeJsonFile(configPath, config);
    console.log(`✓ Wrote project config → ${configPath}`);
    if (!discovered?.projectId) {
      console.log("  No project found yet. Create one in the web app, then re-run setup.");
    }
  }

  console.log("");
  console.log("Next steps:");
  console.log("  1. Restart your coding agent so it reloads MCP + skills.");
  console.log("  2. Ask it to pick up a backlog card or create one for your branch.");
  console.log("  3. Watch the board update as the agent works.");
}
