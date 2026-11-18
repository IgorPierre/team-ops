import { spawn, spawnSync } from "node:child_process";

export interface RunResult {
  ok: boolean;
  output: string;
}

/** Run a command quietly; keep the tail of its output for error messages. */
export function run(cmd: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): Promise<RunResult> {
  return new Promise((resolvePromise) => {
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    let output = "";
    const keep = (chunk: Buffer) => {
      output = (output + chunk.toString()).slice(-8000);
    };
    child.stdout?.on("data", keep);
    child.stderr?.on("data", keep);
    child.on("error", (err) => resolvePromise({ ok: false, output: err.message }));
    child.on("close", (code) => resolvePromise({ ok: code === 0, output }));
  });
}

export function has(cmd: string, args = ["--version"]): boolean {
  const res = spawnSync(cmd, args, { stdio: "ignore", shell: process.platform === "win32" });
  return res.status === 0;
}

export function dockerStatus(): "ready" | "no-daemon" | "missing" {
  if (!has("docker", ["compose", "version"])) return "missing";
  return has("docker", ["info"]) ? "ready" : "no-daemon";
}

export async function waitForHealthy(url: string, timeoutMs = 240_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

export function tail(output: string, lines = 15): string {
  return output.trim().split("\n").slice(-lines).join("\n");
}
