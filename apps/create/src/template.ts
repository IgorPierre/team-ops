import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";

/** Never copied from a local template: build output, deps, secrets, VCS. */
const SKIP = new Set(["node_modules", ".git", ".next", "dist", "coverage", "backups", ".env", ".turbo", ".DS_Store"]);
const SKIP_PATHS = ["apps/api/bin", "apps/api/server"];

export function isLocalTemplate(template: string): boolean {
  return template.startsWith(".") || template.startsWith("/") || /^[A-Za-z]:[\\/]/.test(template) || existsSync(template);
}

export function copyLocalTemplate(source: string, target: string) {
  const from = resolve(source);
  if (!existsSync(join(from, "docker-compose.yml"))) {
    throw new Error(`${from} does not look like a Team-Ops checkout (no docker-compose.yml).`);
  }
  cpSync(from, target, {
    recursive: true,
    filter: (src) => {
      const rel = relative(from, src).split(sep).join("/");
      if (rel === "") return true;
      if (SKIP.has(basename(src))) return false;
      return !SKIP_PATHS.some((p) => rel === p || rel.startsWith(`${p}/`));
    },
  });
}

export function tarballUrl(repo: string, ref: string): string {
  return `https://codeload.github.com/${repo}/tar.gz/${ref}`;
}

/**
 * Download `owner/repo@ref` from GitHub and unpack it into `target`.
 * Tries each ref in order (the CLI's release tag first, then main) and
 * returns the one that worked.
 */
export async function downloadTemplate(repo: string, refs: string[], target: string): Promise<string> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`Template "${repo}" should be owner/repo or a local path.`);
  const scratch = mkdtempSync(join(tmpdir(), "create-team-ops-"));
  try {
    let lastStatus = "";
    for (const ref of refs) {
      const res = await fetch(tarballUrl(repo, ref), { headers: { "User-Agent": "create-team-ops" } });
      if (!res.ok) {
        lastStatus = `${res.status} ${res.statusText}`;
        continue;
      }
      const archive = join(scratch, "template.tar.gz");
      writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
      mkdirSync(target, { recursive: true });
      // GitHub tarballs wrap everything in "<repo>-<ref>/"; strip that level.
      const tar = spawnSync("tar", ["-xzf", archive, "-C", target, "--strip-components=1"], { stdio: "pipe" });
      if (tar.status !== 0) {
        throw new Error(`Could not unpack the template: ${tar.stderr?.toString().trim() || "tar failed"}`);
      }
      return ref;
    }
    throw new Error(`Could not download ${repo} (${refs.join(", ")}): ${lastStatus}`);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

export function isEmptyDir(dir: string): boolean {
  if (!existsSync(dir)) return true;
  if (!statSync(dir).isDirectory()) return false;
  return readdirSync(dir).filter((f) => f !== ".DS_Store" && f !== ".git").length === 0;
}
