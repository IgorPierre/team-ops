export type Database = "bundled" | "external";

export interface CreateOptions {
  /** Directory to create, relative to cwd. */
  directory: string;
  /** Landing / marketing site (apps/website). */
  website: boolean;
  /** MCP server, agent skill and the setup CLI (apps/mcp, apps/setup, skills/). */
  agents: boolean;
  database: Database;
  /** Only for database = "external". */
  databaseUrl: string;
  /** Public URL people open in the browser. */
  appUrl: string;
  /** Anyone may sign up (otherwise invite-only after the first account). */
  openRegistration: boolean;
  /** Load the Northwind Labs demo workspace after starting. */
  seed: boolean;
  install: boolean;
  git: boolean;
  /** `docker compose up -d --build` when finished. */
  start: boolean;
  /** Local directory or `owner/repo` on GitHub. */
  template: string;
  /** Git ref for a GitHub template. Defaults to this CLI's release tag. */
  ref?: string;
  /** Accept defaults for everything not given on the command line. */
  yes: boolean;
  /** Overwrite a non-empty target directory. */
  force: boolean;
}

export const DEFAULT_TEMPLATE = "IgorPierre/team-ops";

export const DEFAULTS: Omit<CreateOptions, "directory"> = {
  website: true,
  agents: true,
  database: "bundled",
  databaseUrl: "",
  appUrl: "http://localhost:3000",
  openRegistration: false,
  seed: false,
  install: true,
  git: true,
  start: false,
  template: DEFAULT_TEMPLATE,
  yes: false,
  force: false,
};

/** Which options the user set explicitly on the command line, so prompts can skip them. */
export type Given = Partial<Record<keyof CreateOptions, true>>;

const BOOL_FLAGS: Partial<Record<string, keyof CreateOptions>> = {
  website: "website",
  landing: "website",
  agents: "agents",
  mcp: "agents",
  "open-registration": "openRegistration",
  seed: "seed",
  install: "install",
  git: "git",
  start: "start",
  yes: "yes",
  force: "force",
};

export function parseArgs(argv: string[]): { options: Partial<CreateOptions>; given: Given; help: boolean; version: boolean } {
  const options: Partial<CreateOptions> = {};
  const given: Given = {};
  let help = false;
  let version = false;

  const set = <K extends keyof CreateOptions>(key: K, value: CreateOptions[K]) => {
    options[key] = value;
    given[key] = true;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      help = true;
      continue;
    }
    if (arg === "-v" || arg === "--version") {
      version = true;
      continue;
    }
    if (arg === "-y") {
      set("yes", true);
      continue;
    }
    if (!arg.startsWith("--")) {
      if (options.directory === undefined) set("directory", arg);
      continue;
    }

    const [rawName, inline] = arg.slice(2).split("=", 2) as [string, string | undefined];
    const value = () => inline ?? argv[++i] ?? "";

    if (rawName.startsWith("no-") && BOOL_FLAGS[rawName.slice(3)]) {
      set(BOOL_FLAGS[rawName.slice(3)]!, false as never);
      continue;
    }
    if (BOOL_FLAGS[rawName]) {
      set(BOOL_FLAGS[rawName]!, (inline === undefined ? true : inline !== "false") as never);
      continue;
    }
    switch (rawName) {
      case "db":
      case "database": {
        const v = value();
        if (v !== "bundled" && v !== "external") throw new Error(`--db must be "bundled" or "external", got "${v}"`);
        set("database", v);
        break;
      }
      case "database-url":
        set("databaseUrl", value());
        if (!given.database) set("database", "external");
        break;
      case "app-url":
        set("appUrl", value());
        break;
      case "template":
        set("template", value());
        break;
      case "ref":
        set("ref", value());
        break;
      default:
        throw new Error(`Unknown option --${rawName}. Run with --help to see what is available.`);
    }
  }
  return { options, given, help, version };
}

export function validateProjectName(name: string | undefined): string | undefined {
  if (!name || !name.trim()) return "Give the project a name.";
  if (/[<>:"|?*]/.test(name)) return "Avoid < > : \" | ? * in the name.";
  return undefined;
}

/** "My Team/" → "my-team": safe for package.json and docker compose project names. */
export function toPackageName(directory: string): string {
  const base = directory.replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? "team-ops";
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");
  return slug || "team-ops";
}

export function validateUrl(value: string | undefined): string | undefined {
  try {
    const url = new URL(value ?? "");
    if (url.protocol !== "http:" && url.protocol !== "https:") return "Use an http:// or https:// URL.";
    return undefined;
  } catch {
    return "That does not look like a URL.";
  }
}

export function validateDatabaseUrl(value: string | undefined): string | undefined {
  if (!value || !/^postgres(ql)?:\/\//.test(value)) return "Expected postgres://user:password@host:5432/db";
  return undefined;
}
