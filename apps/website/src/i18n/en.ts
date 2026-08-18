import type { Messages } from "./types";

export const en: Messages = {
  meta: {
    title: "Team-Ops: Kanban your agents can update",
    description:
      "Self-hosted engineering Kanban. Humans use the board. Agents use the HTTP API and MCP. You run PostgreSQL. MIT. No Team-Ops cloud.",
  },
  nav: {
    product: "Product",
    agents: "Agents",
    faq: "FAQ",
    source: "Repo",
    runIt: "Run it",
    menu: "Menu",
    viewSource: "View repo",
    primary: "Primary",
    mobile: "Mobile",
    language: "Language",
    theme: "Theme",
    themeToDark: "Use dark theme",
    themeToLight: "Use light theme",
  },
  hero: {
    title1: "The board agents",
    title2: "can actually update",
    subtitle: "Self-hosted Kanban on your Postgres. Humans drag cards, agents move them over MCP",
    runItNow: "Run it locally",
    viewSource: "View the repo",
  },
  cloud: { eyebrow: "Works with the agent you already pay for" },
  quote: {
    text: "Coding agents already ==write the code==. The board still ==lags behind==",
    caption: "Host the board that can keep up",
  },
  product: {
    title: "A board your agents can write to",
    p1: "Team-Ops is a **self-hosted engineering Kanban** for people and coding agents on the same team. Humans get four columns: Backlog, In Progress, Review, Done. Agents get an HTTP API and MCP that follow the same rules: optimistic concurrency, idempotent **external_ref**, and a history of who did what.",
    p2: "There is no Team-Ops cloud. You run the API, the web app, and PostgreSQL on a laptop, a VPS, or any host that speaks Postgres. MIT. Fork it, host it, patch it.",
    install: "Clone and install →",
  },
  agents: {
    title: "Ask an agent, watch the card move",
    lead: "Point MCP at your instance. The adapter talks only to your API, never to PostgreSQL",
    tryItOut: "Copy this",
    needs: "Needs `TEAM_OPS_URL` and `TEAM_OPS_TOKEN`. The adapter never talks to PostgreSQL.",
    runStackFirst: "Start the stack first",
    terminal: "Terminal",
    caption:
      "Tell the agent to pick up ERP-142. It moves the card and writes progress. The rest of the team sees it without a standup.",
    inProgress: "In Progress",
    copied: "Copied",
    copy: "Copy",
    copyAria: "Copy command",
    copiedAria: "Copied to clipboard",
  },
  features: {
    title: "Built for mixed teams",
    lead: "People get a board, agents get an API, you keep the database",
    aTitle: "Bring the agent you already use",
    aBody:
      "MCP lists, creates, and moves work through the same Go API the UI uses. It never talks to PostgreSQL. Keep the coding agent you already pay for.",
    bTitle: "Conflicts don't silent-overwrite",
    bBody:
      "Every task has a version. Updates send `expectedVersion`. A conflict returns `TASK_VERSION_CONFLICT` and the board rolls back the optimistic move.",
    bCta: "See how the board works",
    cTitle: "Your Postgres, one env var",
    cBody:
      "Docker, RDS, Cloud SQL, Neon, Supabase. Set `DATABASE_URL`. The app never depends on a Team-Ops cloud or a hosted control plane.",
    cCta: "Use your database",
    dTitle: "MIT. No account, no cloud",
    dBody:
      "Fork it, host it, patch it. No central login. API keys are hashed. Passwords use Argon2id. Put TLS in front with the reverse proxy you already run.",
    dCta: "Open the repo",
  },
  faq: {
    title: "Before you clone",
    items: [
      {
        q: "Do I need a Team-Ops cloud?",
        a: "No. You run the instance and the database. The coding agent you choose may still send context to its own provider.",
      },
      {
        q: "Where does PostgreSQL live?",
        a: "Anywhere Postgres 15+ runs: Docker Compose, RDS, Cloud SQL, Neon, Supabase, Railway, a VM. Set DATABASE_URL. That is the whole integration.",
      },
      {
        q: "How do agents authenticate?",
        a: "Create an agent in the web app and issue a key that starts with tops_sk_. The API stores a hash, never the secret. MCP only needs TEAM_OPS_URL and TEAM_OPS_TOKEN.",
      },
      {
        q: "Can two people edit the same card?",
        a: "Yes. You will see the clash. Updates include expectedVersion. If the card moved underneath you, the API returns TASK_VERSION_CONFLICT and the UI rolls back.",
      },
      {
        q: "Why only four columns?",
        a: "So the board stays a board. Custom workflows, sprints, epics, and mobile apps are out of scope for v1 on purpose.",
      },
      {
        q: "What does it cost?",
        a: "MIT. Clone it, run it, modify it. There is no paid Team-Ops tier in this repository.",
      },
    ],
  },
  cta: {
    title: "Clone it · Run it · Connect an agent",
    titleLines: ["Clone it", "Run it", "Connect an agent"],
    subtitle: "Your machine, your Postgres, the agent you already use",
    github: "Get the repo",
    scrollHint: "Scroll",
  },
  footer: { install: "Install", faq: "FAQ", security: "Security", nav: "Footer" },
};
