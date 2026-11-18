import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { parseArgs } from "./cli.js";
import { baseUrl, mcpUrl, normalizeProjectKey } from "./discover.js";
import { mergeMcpConfig } from "./mcp.js";
import { mcpTarget, skillDir, vscodeUserDir } from "./paths.js";

let dir = "";
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = "";
});
const temp = () => (dir = mkdtempSync(join(tmpdir(), "team-ops-setup-")));

describe("parseArgs", () => {
  it("reads url and project flags", () => {
    const opts = parseArgs(["--url", "https://ops.acme.dev", "--project-key=api", "--yes", "--claude"]);
    expect(opts).toMatchObject({ url: "https://ops.acme.dev", projectKey: "api", yes: true, editor: "claude" });
  });

  it("rejects --token now that editors sign in with OAuth", () => {
    expect(() => parseArgs(["--token", "tops_sk_x"])).toThrow(/OAuth/);
  });

  it("rejects unknown flags instead of ignoring typos", () => {
    expect(() => parseArgs(["--projct-key", "API"])).toThrow(/Unknown option/);
  });
});

describe("urls and keys", () => {
  it("normalizes what people paste", () => {
    expect(baseUrl("https://ops.acme.dev/")).toBe("https://ops.acme.dev");
    expect(baseUrl("https://ops.acme.dev/mcp")).toBe("https://ops.acme.dev");
    expect(mcpUrl("http://localhost:3000/v1")).toBe("http://localhost:3000/mcp");
  });

  it("validates project keys", () => {
    expect(normalizeProjectKey(" api ")).toBe("API");
    expect(normalizeProjectKey("")).toBeUndefined();
    expect(() => normalizeProjectKey("my project")).toThrow(/project key/);
  });
});

describe("editor paths", () => {
  const home = "/home/dev";
  const cwd = "/work/repo";

  it("puts Claude Code user-scope MCP in ~/.claude.json", () => {
    expect(mcpTarget("claude", "global", cwd, home)).toEqual({ path: "/home/dev/.claude.json", format: "claude" });
    expect(mcpTarget("claude", "project", cwd, home).path).toBe("/work/repo/.mcp.json");
  });

  it("uses VS Code's mcp.json and Copilot skill folders", () => {
    expect(mcpTarget("vscode", "project", cwd, home)).toEqual({ path: "/work/repo/.vscode/mcp.json", format: "vscode" });
    expect(skillDir("vscode", "project", cwd, home)).toBe("/work/repo/.github/skills/team-ops");
    expect(skillDir("vscode", "global", cwd, home)).toBe("/home/dev/.copilot/skills/team-ops");
    expect(vscodeUserDir("darwin", home)).toBe("/home/dev/Library/Application Support/Code/User");
    expect(vscodeUserDir("linux", home, {})).toBe("/home/dev/.config/Code/User");
  });
});

describe("mergeMcpConfig", () => {
  it("writes a URL-only entry and replaces an old token-based one", () => {
    const path = join(temp(), "mcp.json");
    writeFileSync(
      path,
      JSON.stringify({
        projects: { a: 1 },
        mcpServers: {
          other: { command: "x" },
          "team-ops": { command: "npx", args: ["-y", "@team-ops/mcp"], env: { TEAM_OPS_TOKEN: "tops_sk_old" } },
        },
      }),
    );
    mergeMcpConfig(path, "https://ops.acme.dev/mcp", "claude");
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw);
    expect(parsed.projects).toEqual({ a: 1 });
    expect(parsed.mcpServers.other.command).toBe("x");
    expect(parsed.mcpServers["team-ops"]).toEqual({ type: "http", url: "https://ops.acme.dev/mcp" });
    expect(raw).not.toMatch(/tops_sk_/);
  });

  it("uses each editor's shape", () => {
    const d = temp();
    mergeMcpConfig(join(d, "c.json"), "https://x/mcp", "cursor");
    mergeMcpConfig(join(d, "v.json"), "https://x/mcp", "vscode");
    expect(JSON.parse(readFileSync(join(d, "c.json"), "utf8")).mcpServers["team-ops"]).toEqual({ url: "https://x/mcp" });
    const v = JSON.parse(readFileSync(join(d, "v.json"), "utf8"));
    expect(v.mcpServers).toBeUndefined();
    expect(v.servers["team-ops"]).toEqual({ type: "http", url: "https://x/mcp" });
  });
});
