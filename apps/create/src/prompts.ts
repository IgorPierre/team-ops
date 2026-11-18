import * as p from "@clack/prompts";
import pc from "picocolors";

import {
  DEFAULTS,
  validateDatabaseUrl,
  validateProjectName,
  validateUrl,
  type CreateOptions,
  type Given,
} from "./options.js";
import { dockerStatus } from "./steps.js";

function bail(): never {
  p.cancel("Cancelled. Nothing was created.");
  process.exit(0);
}

function answer<T>(value: T): Exclude<T, symbol> {
  if (p.isCancel(value)) bail();
  return value as Exclude<T, symbol>;
}

/**
 * Ask for everything the command line didn't already decide. With --yes (or
 * without a TTY) nothing is asked and defaults fill the gaps.
 */
export async function collectOptions(partial: Partial<CreateOptions>, given: Given): Promise<CreateOptions> {
  const interactive = !partial.yes && Boolean(process.stdin.isTTY);
  const o: CreateOptions = { ...DEFAULTS, directory: "team-ops", ...partial } as CreateOptions;

  if (!interactive) {
    if (!given.directory) o.directory = "team-ops";
    return o;
  }

  if (!given.directory) {
    o.directory = answer(
      await p.text({
        message: "Where should we create your Team-Ops?",
        placeholder: "my-team",
        defaultValue: "team-ops",
        validate: (v) => (v ? validateProjectName(v) : undefined),
      }),
    );
  }

  if (!given.website || !given.agents) {
    const picked = answer(
      await p.multiselect<"board" | "website" | "agents">({
        message: `What do you want to install? ${pc.dim("(space to toggle, enter to confirm)")}`,
        options: [
          { value: "board", label: "Board", hint: "web app + API — always included" },
          { value: "agents", label: "AI agents", hint: "MCP server, agent skill and setup CLI" },
          { value: "website", label: "Landing page", hint: "public marketing site (apps/website)" },
        ],
        initialValues: [
          "board",
          ...(o.agents ? (["agents"] as const) : []),
          ...(o.website ? (["website"] as const) : []),
        ],
        required: false,
      }),
    );
    if (!given.agents) o.agents = picked.includes("agents");
    if (!given.website) o.website = picked.includes("website");
  }

  if (!given.database) {
    o.database = answer(
      await p.select<"bundled" | "external">({
        message: "Which database?",
        options: [
          { value: "bundled", label: "Bundled PostgreSQL", hint: "runs in Docker next to the app" },
          { value: "external", label: "My own PostgreSQL 15+", hint: "RDS, Neon, Supabase, Railway…" },
        ],
        initialValue: o.database,
      }),
    );
  }
  if (o.database === "external" && !given.databaseUrl) {
    o.databaseUrl = answer(
      await p.text({
        message: "DATABASE_URL",
        placeholder: "postgres://user:password@host:5432/teamops?sslmode=require",
        validate: validateDatabaseUrl,
      }),
    );
  }

  if (!given.appUrl) {
    o.appUrl = answer(
      await p.text({
        message: "Where will people open it?",
        placeholder: DEFAULTS.appUrl,
        defaultValue: DEFAULTS.appUrl,
        validate: (v) => (v ? validateUrl(v) : undefined),
      }),
    );
  }

  if (!given.openRegistration) {
    o.openRegistration = answer(
      await p.select<boolean>({
        message: "Who can sign up?",
        options: [
          { value: false, label: "Invite only", hint: "the first account owns the instance (recommended)" },
          { value: true, label: "Anyone with the link", hint: "for public demos" },
        ],
        initialValue: o.openRegistration,
      }),
    );
  }

  if (!given.install) {
    o.install = answer(await p.confirm({ message: "Install npm dependencies now?", initialValue: true }));
  }
  if (!given.git) {
    o.git = answer(await p.confirm({ message: "Initialize a git repository?", initialValue: true }));
  }

  if (!given.start) {
    const docker = dockerStatus();
    if (docker === "ready") {
      o.start = answer(
        await p.confirm({
          message: "Build and start it with Docker now?",
          initialValue: true,
        }),
      );
    } else {
      o.start = false;
      p.log.info(
        docker === "missing"
          ? "Docker not found — you can start it later with `docker compose up -d`."
          : "Docker is installed but not running — start it later with `docker compose up -d`.",
      );
    }
  }
  if (o.start && !given.seed) {
    o.seed = answer(
      await p.confirm({
        message: `Load demo data? ${pc.dim("(Northwind Labs workspace, login alex@example.com)")}`,
        initialValue: false,
      }),
    );
  }

  return o;
}
