import { readJsonFile, writeJsonFile } from "./fs.js";
import type { McpFormat } from "./types.js";

type Entry = Record<string, unknown>;
type McpFile = { mcpServers?: Record<string, Entry>; servers?: Record<string, Entry> } & Record<string, unknown>;

/** The hosted endpoint: the editor signs in with OAuth on first use, so there is no secret here. */
export function mcpEntry(format: McpFormat, mcpUrl: string): Entry {
  if (format === "cursor") return { url: mcpUrl };
  return { type: "http", url: mcpUrl };
}

/** Add or replace the `team-ops` server (dropping any old token-based entry), keeping everything else. */
export function mergeMcpConfig(path: string, mcpUrl: string, format: McpFormat) {
  const existing = readJsonFile<McpFile>(path) ?? {};
  const key = format === "vscode" ? "servers" : "mcpServers";
  const servers = { ...(existing[key] as Record<string, Entry> | undefined) };
  servers["team-ops"] = mcpEntry(format, mcpUrl);
  writeJsonFile(path, { ...existing, [key]: servers });
}
