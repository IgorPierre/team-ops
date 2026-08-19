import { describe, expect, it } from "vitest";

import { parseArgs } from "./cli.js";
import { mergeMcpConfig } from "./mcp.js";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("parseArgs", () => {
  it("reads token and url flags", () => {
    const opts = parseArgs(["--url", "http://example.com", "--token", "tops_sk_test", "--yes"]);
    expect(opts.url).toBe("http://example.com");
    expect(opts.token).toBe("tops_sk_test");
    expect(opts.yes).toBe(true);
  });
});

describe("mergeMcpConfig", () => {
  it("preserves existing servers", () => {
    const dir = mkdtempSync(join(tmpdir(), "team-ops-setup-"));
    const path = join(dir, "mcp.json");
    try {
      mergeMcpConfig(path, "http://localhost:8080", "tops_sk_x", false);
      mergeMcpConfig(path, "http://localhost:8080", "tops_sk_y", false);
      const parsed = JSON.parse(readFileSync(path, "utf8")) as {
        mcpServers: Record<string, { env: Record<string, string> }>;
      };
      expect(parsed.mcpServers["team-ops"].env.TEAM_OPS_TOKEN).toBe("tops_sk_y");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
