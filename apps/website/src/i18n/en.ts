import type { Messages } from "./types";

export const en: Messages = {
  meta: {
    title: "Team-Ops — the board for humans and agents",
    description:
      "Self-hosted engineering Kanban. Humans use the board. Agents use the API and MCP. PostgreSQL you control.",
  },
  nav: {
    product: "Product",
    agents: "Agents",
    faq: "FAQ",
    source: "Source",
    runIt: "Run it",
    menu: "Menu",
    viewSource: "View source",
    primary: "Primary",
    mobile: "Mobile",
    language: "Language",
  },
  hero: {
    title1: "The board for humans",
    title2: "and agents.",
    subtitle: "Open source Kanban. You host it. Agents keep it current.",
    runItNow: "Run it now",
    viewSource: "View source",
  },
  cloud: { eyebrow: "Works with the agents you already use" },
  quote: {
    text: "Coding agents already ==write the code==. The board still ==lags behind==.",
    caption: "Team-Ops exists to close that gap.",
  },
  product: {
    title: "What is Team-Ops?",
    p1: "Team-Ops is a **self-hosted engineering Kanban** for mixed teams of people and coding agents. Humans get four fixed columns — Backlog, In Progress, Review, Done. Agents get an HTTP API and an MCP adapter that speak the same rules: optimistic concurrency, idempotent **external_ref**, and an activity history of who did what.",
    p2: "There is no Team-Ops cloud. You run the API, the web app, and PostgreSQL on infrastructure you control — a laptop, a VPS, or any host that speaks Postgres. MIT licensed. Fork it, host it, patch it.",
    install: "Install locally →",
  },
  agents: {
    title: "Agents keep the board current.",
    lead: "Point MCP at your instance. The adapter never talks to the database — only to the API you already run.",
    tryItOut: "Try it out",
    needs: "Needs `TEAM_OPS_URL` and `TEAM_OPS_TOKEN`. The adapter never talks to PostgreSQL.",
    runStackFirst: "Run the stack first",
    terminal: "Terminal",
    caption:
      "Ask the agent to pick up ERP-142. It moves the card, writes progress, and the rest of the team sees it without a standup script.",
    inProgress: "In Progress",
    copied: "Copied",
    copy: "Copy",
    copyAria: "Copy command",
    copiedAria: "Copied to clipboard",
  },
  features: {
    aTitle: "AI-native and agnostic",
    aBody:
      "Works with the coding agent you already pay for. MCP lists, upserts, and moves work through the same Go API humans use. It never talks to PostgreSQL.",
    bTitle: "Version, not last-write-wins.",
    bBody:
      "Every task carries a version. Updates send `expectedVersion`. A conflict returns `TASK_VERSION_CONFLICT` and the board rolls back the optimistic move.",
    bCta: "How the board works",
    cTitle: "Your PostgreSQL. Zero vendor SDK.",
    cBody:
      "Docker, RDS, Cloud SQL, Neon, Supabase — one `DATABASE_URL`. The app never depends on a Team-Ops cloud or a hosted control plane.",
    cCta: "Bring your own database",
    dTitle: "Open source. MIT. Self hosted.",
    dBody:
      "Fork it, host it, patch it. No central account. API keys are hashed. Passwords use Argon2id. Put TLS in front with the reverse proxy you already run.",
    dCta: "View on GitHub",
  },
  faq: {
    title: "Frequently asked",
    items: [
      {
        q: "Does Team-Ops require a Team-Ops cloud?",
        a: "No. The instance and the database run on infrastructure you control. The coding agent you choose may still send context to its own provider.",
      },
      {
        q: "Where should PostgreSQL live?",
        a: "Anywhere compatible: Docker Compose, RDS, Cloud SQL, Neon, Supabase, Railway, a VM. Set DATABASE_URL. That is the whole integration.",
      },
      {
        q: "How do agents authenticate?",
        a: "Create an agent in the web app and issue a key that starts with tops_sk_. The API stores a hash, never the secret. MCP only needs TEAM_OPS_URL and TEAM_OPS_TOKEN.",
      },
      {
        q: "Can two people edit the same card?",
        a: "Yes, but not silently. Updates include expectedVersion. If the card moved underneath you, the API returns TASK_VERSION_CONFLICT and the UI rolls back.",
      },
      {
        q: "Why only four columns?",
        a: "So the board stays a board. Custom workflows, sprints, epics, and mobile apps are out of scope for v1 on purpose.",
      },
      {
        q: "Is it free?",
        a: "MIT. Clone it, run it, modify it. There is no paid Team-Ops tier in this repository.",
      },
    ],
  },
  cta: { title: "Clone it. Run it. Connect an agent.", github: "View on GitHub" },
  footer: { install: "Install", faq: "FAQ", security: "Security", nav: "Footer" },
};
