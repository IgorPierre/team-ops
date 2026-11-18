import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { toPackageName, type CreateOptions } from "./options.js";

/** Paths that only matter to Team-Ops maintainers, never to an instance. */
const ALWAYS_REMOVE = ["apps/create", "docs/publishing", ".github/workflows/release.yml"];

const WEBSITE_PATHS = ["apps/website"];
const AGENT_PATHS = ["apps/mcp", "apps/setup", "skills"];

type Feature = { workspaces: string[]; dockerCopy: string[]; ciSteps: string[]; makeTargets: string[] };

const FEATURES: Record<"website" | "agents", Feature> = {
  website: {
    workspaces: ["apps/website"],
    dockerCopy: ["apps/website/package.json"],
    ciSteps: ["Website"],
    makeTargets: [],
  },
  agents: {
    workspaces: ["apps/mcp", "apps/setup"],
    dockerCopy: ["apps/mcp/package.json", "apps/setup/package.json"],
    ciSteps: ["MCP", "Setup CLI"],
    makeTargets: ["mcp-lint", "mcp-test", "mcp-build", "setup-lint", "setup-test", "setup-build"],
  },
};

function read(root: string, rel: string): string | null {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

function write(root: string, rel: string, content: string) {
  writeFileSync(join(root, rel), content);
}

function remove(root: string, rel: string) {
  rmSync(join(root, rel), { recursive: true, force: true });
}

/** Drop `COPY <path> <path>` lines from a Dockerfile. */
export function stripDockerCopies(dockerfile: string, paths: string[]): string {
  return dockerfile
    .split("\n")
    .filter((line) => !paths.some((p) => new RegExp(`^COPY\\s+${escape(p)}\\b`).test(line.trim())))
    .join("\n");
}

/** Drop whole `- name: <step>` blocks from a GitHub Actions job. */
export function stripCiSteps(workflow: string, names: string[]): string {
  const lines = workflow.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(\s*)- name:\s*(.+?)\s*$/.exec(lines[i]);
    if (m && names.includes(m[2])) {
      const indent = m[1].length;
      i++;
      while (i < lines.length && (lines[i].trim() === "" || lines[i].search(/\S/) > indent)) i++;
      // Blank lines after the step belong to whatever follows it.
      while (i - 1 >= 0 && lines[i - 1].trim() === "" && out.length) i--;
      i--;
      continue;
    }
    out.push(lines[i]);
  }
  return out.join("\n");
}

/** Remove Makefile rules (target line + recipe) and their names from `.PHONY`. */
export function stripMakeTargets(makefile: string, targets: string[]): string {
  if (targets.length === 0) return makefile;
  const drop = new Set(targets);
  const lines = makefile.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith(".PHONY:")) {
      // The .PHONY list may continue over several "\"-terminated lines; keep each line's layout.
      const block = [line];
      while (block[block.length - 1].trimEnd().endsWith("\\") && i + 1 < lines.length) block.push(lines[++i]);
      const kept = block
        .map((l, k) => {
          const indent = k === 0 ? ".PHONY: " : (/^\s*/.exec(l)?.[0] ?? "\t");
          const names = l
            .replace(/^\.PHONY:/, "")
            .replace(/\\\s*$/, "")
            .trim()
            .split(/\s+/)
            .filter((n) => n && !drop.has(n));
          return { indent, names };
        })
        .filter((row, k) => k === 0 || row.names.length > 0);
      kept.forEach((row, k) => {
        const tailSlash = k < kept.length - 1 ? " \\" : "";
        out.push(`${row.indent}${row.names.join(" ")}${tailSlash}`.replace(/^\.PHONY: $/, ".PHONY:"));
      });
      continue;
    }

    const rule = /^([A-Za-z0-9_.-]+):/.exec(line);
    if (rule && drop.has(rule[1])) {
      while (i + 1 < lines.length && lines[i + 1].startsWith("\t")) i++;
      if (i + 1 < lines.length && lines[i + 1].trim() === "") i++;
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Upsert `KEY=value` lines in a dotenv file, keeping comments and order. */
export function setEnv(env: string, values: Record<string, string>): string {
  let out = env.endsWith("\n") || env === "" ? env : `${env}\n`;
  for (const [key, value] of Object.entries(values)) {
    const re = new RegExp(`^#?\\s*${escape(key)}=.*$`, "m");
    const line = `${key}=${value}`;
    out = re.test(out) ? out.replace(re, line) : `${out}${line}\n`;
  }
  return out;
}

export interface CustomizeResult {
  removed: string[];
}

/**
 * Turn a fresh copy of the Team-Ops repo into the user's instance: drop the
 * features they skipped (and every reference to them), name the package, and
 * write a `.env` that matches their answers.
 */
export function customize(root: string, opts: CreateOptions): CustomizeResult {
  const removed: string[] = [];
  const dropped: Feature[] = [];

  for (const rel of ALWAYS_REMOVE) {
    if (existsSync(join(root, rel))) {
      remove(root, rel);
      removed.push(rel);
    }
  }
  if (!opts.website) {
    WEBSITE_PATHS.forEach((rel) => remove(root, rel));
    removed.push(...WEBSITE_PATHS);
    dropped.push(FEATURES.website);
  }
  if (!opts.agents) {
    AGENT_PATHS.forEach((rel) => remove(root, rel));
    removed.push(...AGENT_PATHS);
    dropped.push(FEATURES.agents);
  }

  const gone = {
    workspaces: new Set(["apps/create", ...dropped.flatMap((f) => f.workspaces)]),
    dockerCopy: dropped.flatMap((f) => f.dockerCopy),
    ciSteps: ["Create CLI", ...dropped.flatMap((f) => f.ciSteps)],
    makeTargets: ["create-test", "create-build", ...dropped.flatMap((f) => f.makeTargets)],
  };

  const pkgRaw = read(root, "package.json");
  if (pkgRaw) {
    const pkg = JSON.parse(pkgRaw) as { name?: string; version?: string; workspaces?: string[] };
    pkg.name = toPackageName(opts.directory);
    pkg.version = "0.1.0";
    pkg.workspaces = (pkg.workspaces ?? []).filter((w) => !gone.workspaces.has(w));
    write(root, "package.json", `${JSON.stringify(pkg, null, 2)}\n`);
  }
  // The lockfile describes workspaces that may no longer exist; npm install rebuilds it.
  if (dropped.length > 0) remove(root, "package-lock.json");

  const dockerfile = read(root, "deploy/docker/web.Dockerfile");
  if (dockerfile && gone.dockerCopy.length) {
    write(root, "deploy/docker/web.Dockerfile", stripDockerCopies(dockerfile, gone.dockerCopy));
  }
  const ci = read(root, ".github/workflows/ci.yml");
  if (ci && gone.ciSteps.length) write(root, ".github/workflows/ci.yml", stripCiSteps(ci, gone.ciSteps));
  const makefile = read(root, "Makefile");
  if (makefile && gone.makeTargets.length) write(root, "Makefile", stripMakeTargets(makefile, gone.makeTargets));

  const example = read(root, ".env.example") ?? "";
  const env: Record<string, string> = {
    COMPOSE_PROJECT_NAME: toPackageName(opts.directory),
    APP_URL: opts.appUrl.replace(/\/$/, ""),
    COOKIE_SECURE: opts.appUrl.startsWith("https://") ? "true" : "false",
    REGISTRATION_OPEN: String(opts.openRegistration),
  };
  if (opts.database === "bundled") {
    // Unique per instance; docker compose uses it for both Postgres and the API.
    env.POSTGRES_PASSWORD = randomBytes(18).toString("base64url");
  }
  if (opts.database === "external") {
    env.DATABASE_URL = opts.databaseUrl;
    // docker compose reads COMPOSE_FILE from .env, so a plain `docker compose up` skips the bundled Postgres.
    env.COMPOSE_FILE = ["docker-compose.yml", "deploy/examples/docker-compose.external-db.yml"].join(
      process.platform === "win32" ? ";" : ":",
    );
  }
  write(root, ".env", setEnv(example, env));

  return { removed };
}
