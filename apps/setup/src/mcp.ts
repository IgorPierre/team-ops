import { readJsonFile, writeJsonFile } from "./fs.js";

type McpFile = {
  mcpServers?: Record<
    string,
    {
      command: string;
      args?: string[];
      env?: Record<string, string>;
    }
  >;
};

export function mergeMcpConfig(
  path: string,
  url: string,
  token: string,
  useLocalBinary: boolean,
  localMcpPath?: string,
) {
  const existing = readJsonFile<McpFile>(path) ?? {};
  const servers = existing.mcpServers ?? {};
  servers["team-ops"] = {
    command: useLocalBinary ? "node" : "npx",
    args: useLocalBinary
      ? [localMcpPath ?? "apps/mcp/dist/index.js"]
      : ["-y", "@team-ops/mcp"],
    env: {
      TEAM_OPS_URL: url.replace(/\/$/, ""),
      TEAM_OPS_TOKEN: token,
    },
  };
  writeJsonFile(path, { ...existing, mcpServers: servers });
}
