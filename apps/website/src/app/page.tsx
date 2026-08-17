import { BoardMock } from "@/components/board-mock";
import { FeatureCards } from "@/components/feature-cards";
import { Hero } from "@/components/hero";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { cn, heading, more, section, sectionHead, sectionTitle, wrap } from "@/lib/styles";

const GITHUB = "https://github.com/team-ops/team-ops";

const AGENTS = ["Cursor", "Claude Code", "Codex", "Copilot", "OpenCode"];

const FAQS = [
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
] as const;

export default function HomePage() {
  return (
    <>
      <a
        className="absolute top-[-40px] left-4 z-[600] rounded-sm bg-ink px-3 py-2 text-paper focus:top-4"
        href="#main"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main">
        <Hero />

        <section className={cn(wrap, "pt-20 pb-12 text-center")}>
          <p className="text-[0.8rem] tracking-[0.04em] text-muted">Works with the agents you already use</p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-5 text-[0.95rem] font-semibold text-ink-2 opacity-55">
            {AGENTS.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </section>

        <section className={cn(wrap, "py-16 text-center")}>
          <figure>
            <blockquote className="mx-auto max-w-[28ch] font-display text-[clamp(2rem,4.2vw+0.5rem,3.5rem)] leading-[1.15] font-normal text-ink">
              Coding agents already <mark className="bg-transparent text-accent">write the code</mark>. The board still{" "}
              <mark className="bg-transparent text-accent">lags behind</mark>.
            </blockquote>
            <figcaption className="mt-6 text-[0.9rem] text-muted">Team-Ops exists to close that gap.</figcaption>
          </figure>
        </section>

        <section className={cn(section, wrap)} id="product">
          <article className="min-w-0 rounded-lg border border-rule bg-paper p-8 shadow-card lg:p-12">
            <h2 className={cn(heading, "text-[clamp(1.75rem,2.4vw+0.8rem,2.35rem)]")}>What is Team-Ops?</h2>
            <p className="mt-4">
              Team-Ops is a <strong className="font-semibold text-ink">self-hosted engineering Kanban</strong> for mixed
              teams of people and coding agents. Humans get four fixed columns — Backlog, In Progress, Review, Done.
              Agents get an HTTP API and an MCP adapter that speak the same rules: optimistic concurrency, idempotent{" "}
              <strong className="font-semibold text-ink">external_ref</strong>, and an activity history of who did what.
            </p>
            <p className="mt-4">
              There is no Team-Ops cloud. You run the API, the web app, and PostgreSQL on infrastructure you control — a
              laptop, a VPS, or any host that speaks Postgres. MIT licensed. Fork it, host it, patch it.
            </p>
            <a className={more} href="#install">
              Install locally →
            </a>
          </article>
        </section>

        <section className={cn(section, wrap)} id="agents">
          <div className={sectionHead}>
            <h2 className={sectionTitle}>Agents keep the board current.</h2>
            <p className="mt-3">
              Point MCP at your instance. The adapter never talks to the database — only to the API you already run.
            </p>
          </div>
          <div className="min-w-0 overflow-hidden rounded-lg border border-rule shadow-card">
            <div className="bg-paper-2 p-6">
              <pre className="overflow-x-auto rounded-md bg-graphite p-5 font-mono text-[0.85rem] leading-relaxed text-graphite-ink">{`{
  "mcpServers": {
    "team-ops": {
      "command": "npx",
      "args": ["-y", "@team-ops/mcp"],
      "env": {
        "TEAM_OPS_URL": "http://localhost:8080",
        "TEAM_OPS_TOKEN": "tops_sk_…"
      }
    }
  }
}`}</pre>
            </div>
            <p className="bg-graphite px-6 py-5 text-[0.95rem] text-graphite-ink">
              Ask the agent to pick up ERP-142. It moves the card, writes progress, and the rest of the team sees it
              without a standup script.
            </p>
          </div>
        </section>

        <FeatureCards />

        <section className={cn(section, wrap, "text-center")}>
          <h2 className={cn(sectionTitle, "text-accent-2")}>Open source. Self hosted.</h2>
          <p className="mx-auto mt-5 max-w-[42rem] text-lg">
            MIT licensed. No central account. API keys hashed. Passwords with Argon2id. Put TLS in front with the
            reverse proxy you already use.
          </p>
          <figure className="mt-8 overflow-hidden rounded-lg border border-rule bg-paper-2">
            <svg
              className="block h-auto w-full"
              viewBox="0 0 720 220"
              role="img"
              aria-label="Illustration of activity accumulating on a project board"
            >
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(69.6% 0.17 162.48)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="oklch(69.6% 0.17 162.48)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 180 C 80 176, 120 150, 180 148 C 250 145, 280 110, 360 108 C 440 106, 480 84, 540 70 C 600 56, 660 40, 720 28 L 720 220 L 0 220 Z"
                fill="url(#fill)"
              />
              <path
                d="M0 180 C 80 176, 120 150, 180 148 C 250 145, 280 110, 360 108 C 440 106, 480 84, 540 70 C 600 56, 660 40, 720 28"
                fill="none"
                stroke="oklch(62% 0.155 162)"
                strokeWidth="3"
              />
            </svg>
            <figcaption className="px-6 pt-4 pb-5 text-[0.85rem] text-muted">
              Activity is the product: every move, comment, and completion is recorded. This curve is a picture of that
              idea — not a vanity metric.
            </figcaption>
          </figure>
        </section>

        <section className={cn(section, wrap)}>
          <div className={sectionHead}>
            <h2 className={sectionTitle}>Everything else can wait.</h2>
            <p className="mt-3">Status lives on the board, not in a chat thread that expired yesterday.</p>
          </div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <article className="min-w-0 rounded-lg bg-graphite p-6 text-graphite-ink">
              <h3 className={cn(heading, "mb-4 text-xl text-graphite-ink")}>The lag</h3>
              <p className="grid gap-2 text-[0.88rem] opacity-80">
                <span className="block rounded-sm bg-white/10 p-3">Where is auth?</span>
                <span className="block rounded-sm bg-white/10 p-3">Did the agent finish the PR?</span>
                <span className="block rounded-sm bg-white/10 p-3">Standup in 10 — update Jira first</span>
              </p>
            </article>
            <article className="min-w-0 rounded-lg border border-rule bg-paper p-6">
              <h3 className={cn(heading, "mb-4 text-xl")}>The board</h3>
              <BoardMock variant="light" />
            </article>
          </div>
        </section>

        <section className={cn(section, wrap)} id="install">
          <div className={sectionHead}>
            <h2 className={sectionTitle}>Run it on your machine.</h2>
          </div>
          <pre className="overflow-x-auto rounded-md bg-graphite p-5 font-mono text-[0.85rem] leading-relaxed text-graphite-ink">
            {`git clone https://github.com/team-ops/team-ops
cd team-ops
cp .env.example .env
docker compose up -d
# open http://localhost:3000`}
            <span className="ml-0.5 inline-block w-[0.55ch] animate-blink bg-accent motion-reduce:animate-none" aria-hidden="true" />
          </pre>
        </section>

        <section className={cn(section, wrap)} id="faq">
          <div className="mx-auto max-w-[56rem]">
            <h2 className={cn(sectionTitle, "mb-12 text-center")}>Frequently asked</h2>
            <dl>
              {FAQS.map((item) => (
                <div key={item.q}>
                  <dt className="mt-8 font-semibold text-ink">{item.q}</dt>
                  <dd className="mt-2 text-ink-2">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={cn(wrap, "py-24 text-center")}>
          <h2 className={cn(sectionTitle, "mb-8")}>Clone it. Run it. Connect an agent.</h2>
          <Button variant="accent" href={GITHUB}>
            View on GitHub
          </Button>
        </section>
      </main>
      <footer className="border-t border-rule py-6">
        <div className={cn(wrap, "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[0.85rem] text-muted")}>
          <p>Team-Ops · MIT</p>
          <nav className="flex flex-wrap gap-4" aria-label="Footer">
            <a className="hover:text-ink" href={GITHUB}>
              GitHub
            </a>
            <a className="hover:text-ink" href="#install">
              Install
            </a>
            <a className="hover:text-ink" href="#faq">
              FAQ
            </a>
            <a className="hover:text-ink" href={`${GITHUB}/blob/main/SECURITY.md`}>
              Security
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
