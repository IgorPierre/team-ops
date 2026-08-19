import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

export function readJsonFile<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function writeJsonFile(path: string, value: unknown) {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function bundledAssetsDir() {
  return join(dirname(fileURLToPath(import.meta.url)), "assets");
}

export function copyBundledSkill(targetDir: string) {
  const source = join(bundledAssetsDir(), "SKILL.md");
  if (!existsSync(source)) {
    throw new Error("Bundled skill assets missing. Run npm run build -w @team-ops/setup.");
  }
  ensureDir(targetDir);
  copyFileSync(source, join(targetDir, "SKILL.md"));
  const reference = join(bundledAssetsDir(), "reference.md");
  if (existsSync(reference)) {
    copyFileSync(reference, join(targetDir, "reference.md"));
  }
}
