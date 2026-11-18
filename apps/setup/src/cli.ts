import { createInterface, type Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync } from "node:fs";

import type { Editor, SetupOptions } from "./types.js";

function parseEditor(value: string | undefined): Editor | undefined {
  const v = value?.trim().toLowerCase();
  if (v === "cursor" || v === "claude" || v === "vscode") return v;
  if (v === "claude-code" || v === "claude code") return "claude";
  if (v === "code" || v === "vs code" || v === "copilot") return "vscode";
  return undefined;
}

function detectEditor(cwd: string): Editor {
  if (existsSync(`${cwd}/.cursor`)) return "cursor";
  if (existsSync(`${cwd}/.claude`) || existsSync(`${cwd}/CLAUDE.md`)) return "claude";
  if (existsSync(`${cwd}/.vscode`)) return "vscode";
  return "claude";
}

export type ParsedArgs = SetupOptions & { editorGiven: boolean; scopeGiven: boolean };

export function parseArgs(argv: string[]): ParsedArgs {
  const cwdIndex = argv.indexOf("--cwd");
  const cwd = cwdIndex >= 0 && argv[cwdIndex + 1] ? argv[cwdIndex + 1] : process.cwd();
  const opts = {
    cwd,
    editor: detectEditor(cwd),
    scope: "project" as SetupOptions["scope"],
    url: process.env.TEAM_OPS_URL ?? "",
    projectKey: undefined as string | undefined,
    checkOnly: false,
    yes: false,
    skipSkill: false,
    skipMcp: false,
    skipConfig: false,
    editorGiven: false,
    scopeGiven: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].startsWith("--") && argv[i].includes("=") ? argv[i].split(/=(.*)/s, 2) : [argv[i], undefined];
    const value = () => inline ?? argv[++i];
    switch (flag) {
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      case "--check": opts.checkOnly = true; break;
      case "--yes":
      case "-y": opts.yes = true; break;
      case "--project": opts.scope = "project"; opts.scopeGiven = true; break;
      case "--global": opts.scope = "global"; opts.scopeGiven = true; break;
      case "--cursor":
      case "--claude":
      case "--vscode": opts.editor = flag.slice(2) as Editor; opts.editorGiven = true; break;
      case "--editor": {
        const editor = parseEditor(value());
        if (!editor) throw new Error("--editor must be cursor, claude or vscode");
        opts.editor = editor;
        opts.editorGiven = true;
        break;
      }
      case "--skip-skill": opts.skipSkill = true; break;
      case "--skip-mcp": opts.skipMcp = true; break;
      case "--skip-config": opts.skipConfig = true; break;
      case "--cwd": value(); break;
      case "--url": opts.url = value() ?? ""; break;
      case "--token":
        throw new Error("No token needed anymore: your editor signs in to Team-Ops in the browser (OAuth). Drop --token.");
      case "--project-key": opts.projectKey = value(); break;
      default:
        throw new Error(`Unknown option ${argv[i]}. Run with --help.`);
    }
  }
  if (!opts.url && opts.yes) opts.url = "http://localhost:3000";
  return opts;
}

/** A tiny numbered menu on top of readline; returns the chosen index. */
export async function choose(rl: Interface, question: string, labels: string[], defaultIndex = 0): Promise<number> {
  labels.forEach((label, i) => console.log(`  ${i + 1}) ${label}${i === defaultIndex ? "  (default)" : ""}`));
  for (;;) {
    const raw = (await rl.question(`${question} [${defaultIndex + 1}]: `)).trim();
    if (!raw) return defaultIndex;
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 1 && n <= labels.length) return n - 1;
    console.log(`  Enter a number from 1 to ${labels.length}.`);
  }
}

export function openPrompt(): Interface {
  return createInterface({ input, output });
}

export async function promptMissing(options: ParsedArgs, rl: Interface): Promise<SetupOptions> {
  if (!options.url) {
    options.url =
      (await rl.question("Team-Ops URL (what you open in the browser) [http://localhost:3000]: ")).trim() ||
      "http://localhost:3000";
  }
  if (!options.editorGiven) {
    const editors: Editor[] = ["claude", "cursor", "vscode"];
    const labels = ["Claude Code", "Cursor", "VS Code (Copilot agent mode)"];
    options.editor = editors[await choose(rl, "Which coding agent do you use?", labels, editors.indexOf(options.editor))];
  }
  if (!options.scopeGiven) {
    const i = await choose(
      rl,
      "Install for",
      ["This repository (config you can commit for the team)", "Every repository on this machine"],
      0,
    );
    options.scope = i === 1 ? "global" : "project";
  }
  if (!options.projectKey && !options.skipConfig) {
    options.projectKey =
      (await rl.question("Board project key for this repo, e.g. API (Enter to let the agent ask later): ")).trim() ||
      undefined;
  }
  return options;
}

function printHelp() {
  console.log(`team-ops-setup — connect your coding agent to the Team-Ops board

Run it inside the repository you code in. It adds the Team-Ops MCP server
(<url>/mcp) to your editor, installs the Team-Ops skill, and links the repo
to a board project in .team-ops.json. There is no key: the first time the
editor uses Team-Ops it opens the browser and you sign in.

Usage:
  npx @team-ops/setup [options]

Options:
  --url <url>          Team-Ops URL people open (e.g. https://ops.acme.dev)
  --project-key <KEY>  Board project for this repo (e.g. API)
  --claude | --cursor | --vscode   Coding agent (default: detected)
  --project            This repo only (default) — the config has no secrets, commit it
  --global             Every repo on this machine
  --cwd <dir>          Repository folder (default: current directory)
  --check              Verify the URL, then exit
  --yes, -y            No prompts
  --skip-skill         Don't install the skill
  --skip-mcp           Don't write MCP config
  --skip-config        Don't write .team-ops.json
  -h, --help           Show this help

Environment:
  TEAM_OPS_URL   Default for --url

Examples:
  npx @team-ops/setup
  npx @team-ops/setup --url https://ops.acme.dev --project-key API --claude
`);
}
