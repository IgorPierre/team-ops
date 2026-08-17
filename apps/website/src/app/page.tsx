"use client";

import { useEffect, useMemo, useState } from "react";

const GITHUB = "https://github.com/team-ops/team-ops";

const COMMANDS = [
  { id: "docs", label: "Read the docs", href: "/#install" },
  { id: "mcp", label: "Connect an MCP agent", href: "/#mcp" },
  { id: "github", label: "View on GitHub", href: GITHUB },
  { id: "security", label: "Security notes", href: "/#security" },
];

export default function HomePage() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const filtered = useMemo(
    () =>
      COMMANDS.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        }
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="nav sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <span className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight">
            Team-Ops
          </span>
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            <a href="#how" className="hover:text-[var(--color-ink)]">
              How it works
            </a>
            <a href="#mcp" className="hover:text-[var(--color-ink)]">
              MCP
            </a>
            <a href="#install" className="hover:text-[var(--color-ink)]">
              Install
            </a>
          </nav>
          <button
            type="button"
            className="kbtn ml-auto rounded-[6px] border border-[var(--color-rule)] px-2 py-1 font-[family-name:var(--font-mono)] text-xs tracking-wide"
            onClick={() => setOpen(true)}
          >
            ⌘K
          </button>
          <a href={GITHUB} className="btn-primary px-3 py-1.5 text-sm">
            View on GitHub
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.06em] uppercase">
              Open source · Self hosted · PostgreSQL
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[length:var(--text-display)] leading-[1.08] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              The self-hosted engineering board for humans and AI agents.
            </h1>
            <p className="mt-5 max-w-[65ch] text-lg">
              Developers keep coding. Agents keep the board updated. Team-Ops is a Kanban hub you
              run on infrastructure you control.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={GITHUB} className="btn-primary px-4 py-2 text-sm">
                View on GitHub
              </a>
              <a href="#install" className="rounded-[6px] border border-[var(--color-rule)] px-4 py-2 text-sm">
                Read the Docs
              </a>
            </div>
          </div>
          <figure className="code-card min-w-0 p-4 text-sm">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span>POST /v1/tasks/erp-142/move</span>
              <span className="status-ok">200 OK</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap">
              <span className="tok-key">status</span>: <span>&quot;review&quot;</span>
              {"\n"}
              <span className="tok-key">expectedVersion</span>: 14{"\n"}
              <span className="tok-key">actor</span>: Claude Code / Alex
            </pre>
          </figure>
        </section>

        <section id="how" className="bg-[var(--color-graphite)] py-20 text-[var(--color-graphite-ink)]">
          <div className="mx-auto max-w-6xl px-4">
            <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.06em] uppercase">
              How it works
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold">
              Developers keep coding. Agents keep the board updated.
            </h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-4">
              {[
                ["1.0", "Developer", "Work in Cursor, Claude Code, Codex, or the editor you already use."],
                ["2.0", "Coding agent", "The agent looks up the task, moves it, and writes progress."],
                ["3.0", "Team-Ops API", "All writes go through PostgreSQL. No SaaS control plane."],
                ["4.0", "Shared board", "The rest of the team sees status without a standup script."],
              ].map(([n, t, d]) => (
                <li key={n} className="reveal border-t border-white/15 pt-4">
                  <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.06em] uppercase">
                    {n}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-medium">{t}</h3>
                  <p className="mt-2 text-sm text-white/70">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            Four columns. That is the board.
          </h2>
          <p className="mt-3 max-w-[65ch]">
            Backlog, In Progress, Review, Done. Drag a card, the API stores position and writes an
            activity. Columns stay put.
          </p>
          <div className="mt-8 grid auto-cols-[200px] grid-flow-col gap-3 overflow-x-auto md:auto-cols-fr">
            {["Backlog", "In Progress", "Review", "Done"].map((col, i) => (
              <div key={col} className="rounded-[10px] border border-[var(--color-rule)] p-3">
                <p className="text-sm font-semibold">{col}</p>
                <div className="mt-3 space-y-2">
                  {(i === 3 ? ["Setup project"] : i === 2 ? ["Invoice rounding"] : ["Auth sessions", "MCP docs"]).map(
                    (card) => (
                      <div key={card} className="rounded-[6px] border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-2 text-sm">
                        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-wide uppercase">
                          ERP-{10 + i}
                        </p>
                        {card}
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
              Built for agents, usable by people.
            </h2>
            <p className="mt-4 max-w-[65ch]">
              Humans get a Trello-simple board. Agents get MCP tools that call the same API: list,
              upsert, move, report progress, request review, complete.
            </p>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
              Self-hosted on purpose.
            </h2>
            <ul className="mt-4 space-y-2">
              <li>Your infrastructure</li>
              <li>Your PostgreSQL</li>
              <li>Your data</li>
              <li>Your agents</li>
            </ul>
            <p className="mt-4 max-w-[65ch] text-sm">
              Team-Ops does not require a Team-Ops hosted backend. Your Team-Ops instance and
              database run on infrastructure you control. The coding agent you choose may still
              send context to its own provider.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            Architecture
          </h2>
          <pre className="mt-4 overflow-x-auto rounded-[10px] border border-[var(--color-rule)] p-4 font-[family-name:var(--font-mono)] text-sm">
            {`Developer  ↔  AI Agent  ↔  Team-Ops MCP
                              ↓
                         Team-Ops API
                              ↓
                          PostgreSQL
                              ↓
                         Team-Ops Web`}
          </pre>
        </section>

        <section id="install" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            Installation
          </h2>
          <pre className="code-card mt-4 overflow-x-auto p-4 text-sm">
            {`git clone https://github.com/team-ops/team-ops
cd team-ops
cp .env.example .env
docker compose up -d
# open http://localhost:3000`}
          </pre>
        </section>

        <section id="mcp" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            MCP
          </h2>
          <p className="mt-3 max-w-[65ch]">
            Point any MCP client at <code>@team-ops/mcp</code>. It only needs the instance URL and
            an API key. It never talks to PostgreSQL.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-[10px] border border-[var(--color-rule)] p-4 font-[family-name:var(--font-mono)] text-sm">
            {`TEAM_OPS_URL=https://teamops.company.com
TEAM_OPS_TOKEN=tops_sk_...`}
          </pre>
        </section>

        <section id="security" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            Security
          </h2>
          <p className="mt-3 max-w-[65ch]">
            Passwords are hashed with Argon2id. API keys are stored as hashes. Sessions are HTTP-only
            cookies. Put TLS in front with Caddy, nginx, or your cloud load balancer. See SECURITY.md.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
            Open source
          </h2>
          <p className="mt-3 max-w-[65ch]">
            MIT licensed. No central account. Fork it, host it, patch it. Contributions land through
            GitHub.
          </p>
          <a href={GITHUB} className="btn-primary mt-6 inline-block px-4 py-2 text-sm">
            View on GitHub
          </a>
        </section>
      </main>

      <footer className="border-t border-[var(--color-rule)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm">
          <span className="font-[family-name:var(--font-display)] font-medium">Team-Ops</span>
          <span>The self-hosted engineering board for humans and AI agents.</span>
        </div>
      </footer>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-24"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[10px] border border-[var(--color-rule)] bg-[var(--color-paper)] p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              className="w-full rounded-[6px] border border-[var(--color-rule)] px-3 py-2 font-[family-name:var(--font-mono)] text-sm"
              placeholder="Filter commands"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, filtered.length - 1));
                if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
                if (e.key === "Enter" && filtered[active]) {
                  window.location.href = filtered[active].href;
                }
              }}
            />
            <ul className="mt-2">
              {filtered.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className={`block rounded-[6px] px-3 py-2 text-sm ${i === active ? "bg-[var(--color-paper-2)]" : ""}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
