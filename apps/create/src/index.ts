import * as p from "@clack/prompts";
import { relative, resolve } from "node:path";
import pc from "picocolors";

import { customize } from "./customize.js";
import { parseArgs, toPackageName, type CreateOptions } from "./options.js";
import { collectOptions } from "./prompts.js";
import { has, run, tail, waitForHealthy } from "./steps.js";
import { copyLocalTemplate, downloadTemplate, isEmptyDir, isLocalTemplate } from "./template.js";

declare const __VERSION__: string;
const VERSION = typeof __VERSION__ === "string" ? __VERSION__ : "0.0.0-dev";

const HELP = `${pc.bold("create-team-ops")} — scaffold a self-hosted Team-Ops instance

${pc.bold("Usage")}
  npm create team-ops@latest [directory] [options]
  npx create-team-ops [directory] [options]

${pc.bold("What to install")}
  --website / --no-website     Landing page (apps/website)            [default: yes]
  --agents  / --no-agents      MCP server, agent skill, setup CLI     [default: yes]

${pc.bold("Configuration")}
  --db <bundled|external>      PostgreSQL in Docker, or your own      [default: bundled]
  --database-url <url>         Connection string (implies --db external)
  --app-url <url>              Public URL of the web app              [default: http://localhost:3000]
  --open-registration          Anyone can sign up (default: invite only)

${pc.bold("After scaffolding")}
  --install / --no-install     npm install                            [default: yes]
  --git / --no-git             git init + first commit                [default: yes]
  --start / --no-start         docker compose up -d --build           [default: ask]
  --seed                       Load demo data after starting

${pc.bold("Other")}
  --template <owner/repo|dir>  Template source                        [default: IgorPierre/team-ops]
  --ref <git ref>              Branch or tag of the template          [default: v${VERSION}, then main]
  --force                      Use a non-empty directory anyway
  -y, --yes                    Accept defaults, ask nothing
  -v, --version                Print the version
  -h, --help                   Show this help

${pc.bold("Examples")}
  npm create team-ops@latest my-team
  npm create team-ops@latest my-team -- --no-website --db external --database-url postgres://…
  npx create-team-ops ops --yes --start --seed
`;

async function main() {
  const { options: partial, given, help, version } = parseArgs(process.argv.slice(2));
  if (help) {
    console.log(HELP);
    return;
  }
  if (version) {
    console.log(VERSION);
    return;
  }

  console.log("");
  p.intro(`${pc.bgBlue(pc.white(" Team-Ops "))} ${pc.dim(`v${VERSION}`)}  ${pc.dim("the engineering board for humans and AI agents")}`);

  const opts = await collectOptions(partial, given);
  const target = resolve(opts.directory);
  const shown = relative(process.cwd(), target) || ".";

  if (!isEmptyDir(target) && !opts.force) {
    if (opts.yes || !process.stdin.isTTY) {
      throw new Error(`${shown} is not empty. Pick another directory or pass --force.`);
    }
    const overwrite = await p.confirm({
      message: `${shown} is not empty. Put Team-Ops in there anyway? Existing files with the same names are replaced.`,
      initialValue: false,
    });
    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Cancelled. Nothing was changed.");
      return;
    }
  }

  await scaffold(opts, target);
  await postInstall(opts, target);
  printNextSteps(opts, shown);
}

async function scaffold(opts: CreateOptions, target: string) {
  const s = p.spinner();
  if (isLocalTemplate(opts.template)) {
    s.start(`Copying template from ${opts.template}`);
    copyLocalTemplate(opts.template, target);
    s.stop(`Copied template from ${opts.template}`);
  } else {
    const refs = opts.ref ? [opts.ref] : [`v${VERSION}`, "main"];
    s.start(`Downloading ${opts.template}`);
    try {
      const ref = await downloadTemplate(opts.template, refs, target);
      s.stop(`Downloaded ${opts.template}@${ref}`);
    } catch (error) {
      s.error("Download failed");
      throw error;
    }
  }

  const { removed } = customize(target, opts);
  const kept = ["board", opts.agents && "AI agents", opts.website && "landing page"].filter(Boolean).join(", ");
  p.log.success(`Configured ${pc.bold(toPackageName(opts.directory))}: ${kept}`);
  if (removed.length) p.log.message(pc.dim(`Left out: ${removed.join(", ")}`));
  p.log.message(
    pc.dim(
      `.env → APP_URL=${opts.appUrl}, ${opts.database === "external" ? "external PostgreSQL" : "bundled PostgreSQL"}, ${
        opts.openRegistration ? "open registration" : "invite-only"
      }`,
    ),
  );
}

async function postInstall(opts: CreateOptions, target: string) {
  // A clack spinner prints nothing once stopped, so every step gets its own.
  let s = p.spinner();

  if (opts.install) {
    s.start("Installing dependencies (npm install)");
    const res = await run("npm", ["install", "--no-audit", "--no-fund"], target);
    if (res.ok) s.stop("Installed dependencies");
    else {
      s.error("npm install failed — run it yourself later");
      p.log.message(pc.dim(tail(res.output)));
    }
  }

  if (opts.git && has("git")) {
    const init = await run("git", ["init", "-q", "-b", "main"], target);
    if (init.ok) {
      await run("git", ["add", "-A"], target);
      const commit = await run("git", ["commit", "-q", "-m", "Initial commit from create-team-ops"], target);
      p.log.success(commit.ok ? "Initialized git repository" : "Initialized git repository (commit skipped — set git user.name/email)");
    } else {
      p.log.warn("git init failed; skipping.");
    }
  }

  if (!opts.start) return;

  s = p.spinner();
  s.start("Building and starting containers (docker compose up -d --build) — first run takes a few minutes");
  const up = await run("docker", ["compose", "up", "-d", "--build"], target);
  if (!up.ok) {
    s.error("docker compose failed");
    p.log.message(pc.dim(tail(up.output)));
    return;
  }
  s.message("Waiting for the API to report healthy");
  const healthy = await waitForHealthy("http://localhost:8080/healthz");
  if (healthy) s.stop("Team-Ops is running");
  else s.error("Containers started, but the API is not healthy yet");
  if (!healthy) {
    p.log.message(pc.dim("Check the logs with: docker compose logs api"));
    return;
  }

  if (opts.seed) {
    s = p.spinner();
    s.start("Loading demo data");
    const seed = await run("docker", ["compose", "exec", "-T", "api", "/app/seed"], target);
    if (seed.ok) s.stop("Loaded demo data — log in as alex@example.com / password123");
    else {
      s.error("Seeding failed");
      p.log.message(pc.dim(tail(seed.output)));
    }
  }
}

function printNextSteps(opts: CreateOptions, shown: string) {
  const cd = shown === "." ? [] : [`cd ${shown}`];
  const lines: string[] = [];

  if (opts.start) {
    lines.push(
      opts.seed
        ? `Open ${pc.cyan(opts.appUrl)} and log in as alex@example.com / password123.`
        : `Open ${pc.cyan(opts.appUrl)} and create the first account.`,
    );
  } else {
    lines.push(...cd, "docker compose up -d", `open ${opts.appUrl}`);
  }
  lines.push("");
  lines.push(pc.bold("Develop locally"));
  lines.push(...(opts.start ? cd : []), "make dev        # Postgres + instructions", "make api-dev    # API on :8080");
  lines.push("npm run dev -w @team-ops/web");
  if (opts.website) lines.push("npm run dev -w @team-ops/website   # landing page");
  if (opts.agents) {
    lines.push("");
    lines.push(pc.bold("Connect a coding agent"));
    lines.push(`1. In the repo you code in: npx @team-ops/setup --url ${opts.appUrl.replace(/\/$/, "")}`);
    lines.push("2. Restart the editor and sign in when it asks — no keys to copy");
  }
  if (opts.database === "external") {
    lines.push("");
    lines.push(pc.dim("Using your DATABASE_URL — the bundled Postgres container is disabled via COMPOSE_FILE in .env."));
  }

  p.note(lines.join("\n"), "Next steps");
  p.outro(`Done. Docs: ${pc.underline("https://github.com/IgorPierre/team-ops#readme")}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  p.cancel(message);
  process.exit(1);
});
