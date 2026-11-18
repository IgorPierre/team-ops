import { homedir } from "node:os";
import { join } from "node:path";

import type { Editor, McpTarget, Scope } from "./types.js";

/**
 * Where each editor looks for agent skills:
 * - Cursor:      .cursor/skills/          ~/.cursor/skills/
 * - Claude Code: .claude/skills/          ~/.claude/skills/
 * - VS Code (Copilot agent mode): .github/skills/   ~/.copilot/skills/
 */
export function skillDir(editor: Editor, scope: Scope, cwd: string, home = homedir()) {
  const base = scope === "global" ? home : cwd;
  if (editor === "cursor") return join(base, ".cursor/skills/team-ops");
  if (editor === "claude") return join(base, ".claude/skills/team-ops");
  return scope === "global" ? join(home, ".copilot/skills/team-ops") : join(cwd, ".github/skills/team-ops");
}

/** VS Code's per-user settings folder, which holds the user-level mcp.json. */
export function vscodeUserDir(platform = process.platform, home = homedir(), env = process.env) {
  if (platform === "darwin") return join(home, "Library/Application Support/Code/User");
  if (platform === "win32") return join(env.APPDATA ?? join(home, "AppData/Roaming"), "Code/User");
  return join(env.XDG_CONFIG_HOME ?? join(home, ".config"), "Code/User");
}

/**
 * MCP config location and shape per editor:
 * - Cursor:      .cursor/mcp.json · ~/.cursor/mcp.json        → { mcpServers: { url } }
 * - Claude Code: .mcp.json        · ~/.claude.json (user scope) → { mcpServers: { type: "http", url } }
 * - VS Code:     .vscode/mcp.json · <user dir>/mcp.json       → { servers: { type: "http", url } }
 */
export function mcpTarget(editor: Editor, scope: Scope, cwd: string, home = homedir()): McpTarget {
  if (editor === "cursor") {
    return { path: join(scope === "global" ? home : cwd, ".cursor/mcp.json"), format: "cursor" };
  }
  if (editor === "claude") {
    return { path: scope === "global" ? join(home, ".claude.json") : join(cwd, ".mcp.json"), format: "claude" };
  }
  return {
    path: scope === "global" ? join(vscodeUserDir(process.platform, home), "mcp.json") : join(cwd, ".vscode/mcp.json"),
    format: "vscode",
  };
}

export function teamOpsConfigPath(cwd: string) {
  return join(cwd, ".team-ops.json");
}
