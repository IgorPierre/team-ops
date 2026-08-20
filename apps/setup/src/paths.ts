import { homedir } from "node:os";
import { join } from "node:path";

import type { Editor, Scope } from "./types.js";

export function skillDir(editor: Editor, scope: Scope, cwd: string) {
  if (editor === "cursor") {
    return scope === "global"
      ? join(homedir(), ".cursor/skills/team-ops")
      : join(cwd, ".cursor/skills/team-ops");
  }
  if (editor === "claude") {
    return scope === "global"
      ? join(homedir(), ".claude/skills/team-ops")
      : join(cwd, ".claude/skills/team-ops");
  }
  return join(cwd, ".cursor/skills/team-ops");
}

export function mcpConfigPath(editor: Editor, scope: Scope, cwd: string) {
  if (editor === "cursor") {
    return scope === "global" ? join(homedir(), ".cursor/mcp.json") : join(cwd, ".cursor/mcp.json");
  }
  if (editor === "claude") {
    return scope === "global" ? join(homedir(), ".mcp.json") : join(cwd, ".mcp.json");
  }
  return scope === "global" ? join(homedir(), ".vscode/mcp.json") : join(cwd, ".vscode/mcp.json");
}

export function teamOpsConfigPath(cwd: string) {
  return join(cwd, ".team-ops.json");
}
