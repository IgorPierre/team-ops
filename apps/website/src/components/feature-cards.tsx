import { TerminalBackground } from "@/components/terminal-background";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardTitle, Code } from "@/components/ui/card";
import { ChipList } from "@/components/ui/chip";
import { wrap } from "@/lib/styles";

const GITHUB = "https://github.com/team-ops/team-ops";

const AGENTS = ["Cursor", "Claude Code", "Codex", "Copilot", "OpenCode"] as const;

export function FeatureCards() {
  return (
    <section className={`${wrap} py-16`} id="features">
      <div className="grid min-w-0 gap-6 sm:grid-cols-2">
        <Card background={<TerminalBackground />} contentClassName="pr-[42%] sm:pr-[46%]">
          <CardTitle>AI-native and agnostic</CardTitle>
          <CardBody className="text-ink-2">
            Works with the coding agent you already pay for. MCP lists, upserts, and moves work through the same Go API
            humans use. It never talks to PostgreSQL.
          </CardBody>
          <CardFooter>
            <ChipList items={AGENTS} />
          </CardFooter>
        </Card>

        <Card>
          <CardTitle>Version, not last-write-wins.</CardTitle>
          <CardBody className="text-ink-2">
            Every task carries a version. Updates send <Code>expectedVersion</Code>. A conflict returns{" "}
            <Code>TASK_VERSION_CONFLICT</Code> and the board rolls back the optimistic move.
          </CardBody>
          <CardFooter>
            <Button variant="pill" href="#product">
              How the board works
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardTitle>Your PostgreSQL. Zero vendor SDK.</CardTitle>
          <CardBody className="text-ink-2">
            Docker, RDS, Cloud SQL, Neon, Supabase — one <Code>DATABASE_URL</Code>. The app never depends on a Team-Ops
            cloud or a hosted control plane.
          </CardBody>
          <CardFooter>
            <Button variant="pill" href="#install">
              Bring your own database
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardTitle>Open source. MIT. Self hosted.</CardTitle>
          <CardBody className="text-ink-2">
            Fork it, host it, patch it. No central account. API keys are hashed. Passwords use Argon2id. Put TLS in
            front with the reverse proxy you already run.
          </CardBody>
          <CardFooter>
            <Button variant="pill" href={GITHUB}>
              View on GitHub
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
