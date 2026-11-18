import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { customize, setEnv, stripCiSteps, stripDockerCopies, stripMakeTargets } from "./customize.js";
import { DEFAULTS, parseArgs, toPackageName, type CreateOptions } from "./options.js";
import { copyLocalTemplate, tarballUrl } from "./template.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("parseArgs", () => {
  it("reads the directory and boolean flags with --no- negation", () => {
    const { options, given } = parseArgs(["my-team", "--no-website", "--agents", "--seed", "-y"]);
    expect(options).toMatchObject({ directory: "my-team", website: false, agents: true, seed: true, yes: true });
    expect(given.website).toBe(true);
    expect(given.database).toBeUndefined();
  });

  it("implies an external database from --database-url", () => {
    const { options } = parseArgs(["--database-url", "postgres://u:p@db:5432/x"]);
    expect(options.database).toBe("external");
    expect(options.databaseUrl).toBe("postgres://u:p@db:5432/x");
  });

  it("supports --key=value and rejects unknown flags", () => {
    expect(parseArgs(["--app-url=https://ops.example.com"]).options.appUrl).toBe("https://ops.example.com");
    expect(() => parseArgs(["--nope"])).toThrow(/Unknown option/);
    expect(() => parseArgs(["--db", "mysql"])).toThrow(/bundled/);
  });
});

describe("helpers", () => {
  it("slugs package names", () => {
    expect(toPackageName("My Team/")).toBe("my-team");
    expect(toPackageName("../work/Ops HQ")).toBe("ops-hq");
    expect(toPackageName("***")).toBe("team-ops");
  });

  it("upserts env values, uncommenting existing keys", () => {
    const env = "# comment\nAPP_URL=http://localhost:3000\n# COMPOSE_PROFILES=\n";
    const out = setEnv(env, { APP_URL: "https://x.dev", COMPOSE_PROFILES: "a", NEW_KEY: "1" });
    expect(out).toBe("# comment\nAPP_URL=https://x.dev\nCOMPOSE_PROFILES=a\nNEW_KEY=1\n");
  });

  it("strips Dockerfile COPY lines", () => {
    const df = "COPY package.json ./\nCOPY apps/website/package.json apps/website/package.json\nRUN npm install";
    expect(stripDockerCopies(df, ["apps/website/package.json"])).toBe("COPY package.json ./\nRUN npm install");
  });

  it("strips CI steps by name", () => {
    const ci = [
      "    steps:",
      "      - name: Web",
      "        run: |",
      "          npm run build -w web",
      "      - name: MCP",
      "        run: |",
      "          npm run build -w mcp",
      "      - name: Website",
      "        run: npm run build -w website",
      "",
    ].join("\n");
    expect(stripCiSteps(ci, ["MCP", "Website"])).toBe(
      ["    steps:", "      - name: Web", "        run: |", "          npm run build -w web", ""].join("\n"),
    );
  });

  it("strips Makefile rules and their .PHONY names", () => {
    const mk = [
      ".PHONY: dev build \\",
      "\tmcp-lint mcp-build \\",
      "\tsmoke-test",
      "",
      "dev:",
      "\techo dev",
      "",
      "mcp-lint:",
      "\tnpm run lint",
      "",
      "mcp-build:",
      "\tnpm run build",
      "",
      "smoke-test:",
      "\tbash smoke.sh",
    ].join("\n");
    const out = stripMakeTargets(mk, ["mcp-lint", "mcp-build"]);
    expect(out).not.toMatch(/mcp-/);
    expect(out).toMatch(/^\.PHONY: dev build \\\n\tsmoke-test$/m);
    expect(out).toMatch(/dev:\n\techo dev\n\nsmoke-test:/);
  });

  it("builds codeload URLs", () => {
    expect(tarballUrl("IgorPierre/team-ops", "v1.0.0")).toBe(
      "https://codeload.github.com/IgorPierre/team-ops/tar.gz/v1.0.0",
    );
  });
});

describe("scaffold from this repository", () => {
  let dir = "";
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  function scaffold(overrides: Partial<CreateOptions>) {
    dir = mkdtempSync(join(tmpdir(), "create-team-ops-test-"));
    const target = join(dir, "acme-ops");
    copyLocalTemplate(repoRoot, target);
    const opts: CreateOptions = { ...DEFAULTS, directory: "acme-ops", ...overrides };
    customize(target, opts);
    const read = (rel: string) => readFileSync(join(target, rel), "utf8");
    return { target, read };
  }

  it("keeps everything selected, drops maintainer-only files, writes .env", () => {
    const { target, read } = scaffold({});
    expect(existsSync(join(target, "node_modules"))).toBe(false);
    expect(existsSync(join(target, "apps/create"))).toBe(false);
    expect(existsSync(join(target, ".github/workflows/release.yml"))).toBe(false);
    expect(existsSync(join(target, "apps/website"))).toBe(true);
    expect(existsSync(join(target, "apps/mcp"))).toBe(true);
    expect(existsSync(join(target, "package-lock.json"))).toBe(true);

    const pkg = JSON.parse(read("package.json"));
    expect(pkg.name).toBe("acme-ops");
    expect(pkg.workspaces).not.toContain("apps/create");
    expect(pkg.workspaces).toContain("apps/website");

    const env = read(".env");
    expect(env).toMatch(/^APP_URL=http:\/\/localhost:3000$/m);
    expect(env).toMatch(/^REGISTRATION_OPEN=false$/m);
    expect(env).toMatch(/^COMPOSE_PROJECT_NAME=acme-ops$/m);
    expect(env).not.toMatch(/^COMPOSE_FILE=/m);
    expect(env).toMatch(/^POSTGRES_PASSWORD=[A-Za-z0-9_-]{24}$/m);

    expect(read(".github/workflows/ci.yml")).not.toMatch(/create-team-ops/);
    expect(read("Makefile")).not.toMatch(/create-(test|build)/);
    expect(read("Makefile")).toMatch(/^mcp-build:/m);
  });

  it("leaves out the landing page and agents with every reference to them", () => {
    const { target, read } = scaffold({
      website: false,
      agents: false,
      database: "external",
      databaseUrl: "postgres://u:p@db.example.com:5432/ops",
      appUrl: "https://ops.acme.dev",
      openRegistration: true,
    });
    for (const rel of ["apps/website", "apps/mcp", "apps/setup", "skills", "package-lock.json"]) {
      expect(existsSync(join(target, rel)), rel).toBe(false);
    }
    expect(existsSync(join(target, "apps/web"))).toBe(true);
    expect(existsSync(join(target, "apps/api"))).toBe(true);

    const pkg = JSON.parse(read("package.json"));
    expect(pkg.workspaces).toEqual(["apps/web", "packages/api-client", "packages/mcp-server"]);

    const dockerfile = read("deploy/docker/web.Dockerfile");
    expect(dockerfile).not.toMatch(/apps\/(website|mcp|setup)/);
    expect(dockerfile).toMatch(/COPY apps\/web\/package.json/);

    const ci = read(".github/workflows/ci.yml");
    expect(ci).not.toMatch(/@team-ops\/(website|mcp|setup)(?![\w-])/);
    expect(ci).toMatch(/@team-ops\/mcp-server/);
    expect(ci).toMatch(/npm run build -w @team-ops\/web/);

    const makefile = read("Makefile");
    expect(makefile).not.toMatch(/^(mcp|setup)-/m);
    expect(makefile).toMatch(/^smoke-test:/m);

    const env = read(".env");
    expect(env).toMatch(/^DATABASE_URL=postgres:\/\/u:p@db\.example\.com:5432\/ops$/m);
    expect(env).toMatch(/^COMPOSE_FILE=docker-compose\.yml.deploy\/examples\/docker-compose\.external-db\.yml$/m);
    expect(env).toMatch(/^COOKIE_SECURE=true$/m);
    expect(env).toMatch(/^REGISTRATION_OPEN=true$/m);
  });
});
