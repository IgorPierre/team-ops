import { cn } from "@/lib/styles";

type Variant = "hero" | "light" | "dark";

const COLUMNS = [
  {
    name: "Backlog",
    cards: [
      { key: "SITE-57", title: "Session cookies" },
      { key: "ERP-12", title: "Invoice rounding" },
    ],
  },
  {
    name: "In Progress",
    cards: [{ key: "ERP-142", title: "Auth sessions", active: true }],
  },
  {
    name: "Review",
    cards: [{ key: "APP-32", title: "MCP docs" }],
  },
  {
    name: "Done",
    cards: [{ key: "SITE-4", title: "Compose install" }],
  },
] as const;

export function BoardMock({ variant = "hero" }: { variant?: Variant }) {
  const light = variant === "light";

  return (
    <figure
      className={cn(
        "min-w-0 rounded-lg p-4 shadow-float",
        light ? "border border-rule bg-paper text-ink" : "bg-graphite text-graphite-ink",
      )}
    >
      <div className="grid auto-cols-[minmax(140px,1fr)] grid-flow-col gap-3 overflow-x-auto">
        {COLUMNS.map((column) => (
          <div key={column.name}>
            <p className="mb-2 text-[0.72rem] tracking-[0.04em] uppercase opacity-70">{column.name}</p>
            {column.cards.map((card) => {
              const active = "active" in card && card.active;
              return (
                <article
                  key={card.key}
                  className={cn(
                    "mb-2 rounded-sm border p-3",
                    light
                      ? "border-rule bg-paper-2"
                      : "border-white/10 bg-white/10",
                    active && "bg-[color-mix(in_oklab,var(--color-accent)_18%,var(--color-graphite-2))] outline outline-1 outline-accent",
                  )}
                >
                  <p className="font-mono text-[0.65rem] tracking-[0.04em] text-accent uppercase">{card.key}</p>
                  <p className="mt-1 text-[0.9rem]">{card.title}</p>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </figure>
  );
}
