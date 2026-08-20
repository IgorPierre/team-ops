"use client";

import {
  type ComponentProps,
  Fragment,
  type HTMLAttributes,
  type ReactElement,
  useEffect,
  useState,
} from "react";
import { TerminalIcon } from "lucide-react";

import { CopyableCommand } from "@/components/copyable-command";
import LetterGlitch from "@/components/letter-glitch";
import { useI18n } from "@/i18n/provider";
import { InlineMarkup } from "@/i18n/markup";
import { GITHUB } from "@/lib/site";
import { cn } from "@/lib/styles";

function PipelineReadyWindow({
  status,
  ...props
}: HTMLAttributes<HTMLDivElement> & { status: string }) {
  return (
    <div
      {...props}
      className={cn("overflow-hidden rounded-md border border-rule bg-paper shadow-lg", props.className)}
    >
      <p className="border-b border-rule px-4 py-2 text-center text-xs text-muted">ERP-142 Auth sessions</p>
      <p className="px-4 py-2 text-sm text-ink">{status}</p>
    </div>
  );
}

function CreateAppAnimation({
  status,
  ...props
}: ComponentProps<"div"> & { status: string }) {
  const installCmd = "team_ops_move_task ERP-142 --status in_progress --expected_version 12";
  const tickTime = 100;
  const timeCommandEnter = installCmd.length;
  const timeCommandRun = timeCommandEnter + 3;
  const timeCommandEnd = timeCommandRun + 3;
  const timeWindowOpen = timeCommandEnd + 1;
  const timeEnd = timeWindowOpen + 1;
  const pauseTicks = 40;
  const cycleEnd = timeEnd + pauseTicks;

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTick(timeEnd);
      return;
    }
    const timer = setInterval(() => {
      setTick((prev) => (prev >= cycleEnd ? 0 : prev + 1));
    }, tickTime);
    return () => clearInterval(timer);
  }, [cycleEnd, timeEnd]);

  const lines: ReactElement[] = [];

  lines.push(
    <span key="command_type">
      {installCmd.substring(0, tick)}
      {tick < timeCommandEnter && <div className="inline-block h-3 w-1 animate-pulse bg-ink" />}
    </span>,
  );

  if (tick >= timeCommandEnter) {
    lines.push(<span key="space"> </span>);
  }

  if (tick > timeCommandRun)
    lines.push(
      <Fragment key="command_response">
        {tick > timeCommandRun + 1 && (
          <>
            <span className="font-medium">◆ team_ops_list_tasks</span>
            <span>│ ERP-142 Auth sessions · Backlog</span>
          </>
        )}
        {tick > timeCommandRun + 2 && (
          <>
            <span className="font-medium">◆ team_ops_move_task → in_progress</span>
            <span>│ expected_version 12 accepted</span>
          </>
        )}
        {tick > timeCommandRun + 3 && (
          <>
            <span className="font-medium">◆ team_ops_report_progress</span>
          </>
        )}
      </Fragment>,
    );

  return (
    <div {...props}>
      {tick > timeWindowOpen && (
        <PipelineReadyWindow
          status={status}
          className="absolute inset-x-4 bottom-5 z-10 max-w-[calc(100%-2rem)] animate-terminal-popup sm:inset-x-auto sm:right-4 sm:max-w-[220px]"
        />
      )}
      <pre className="min-h-[180px] font-mono text-xs break-all whitespace-pre-wrap sm:min-h-[240px] sm:text-sm">
        <code className="grid">{lines}</code>
      </pre>
    </div>
  );
}

export function AgentsDemo() {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-[360px] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl p-3 sm:min-h-[520px] sm:gap-6 sm:rounded-2xl sm:p-6 md:p-10 lg:min-h-[560px] lg:gap-8">
      <div className="absolute inset-0 -z-[1]">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette
          outerVignette={false}
          smooth
          glitchColors={["#2b4539", "#61dca3", "#61b3dc"]}
        />
        <div className="absolute inset-0 bg-black/35" aria-hidden />
      </div>

      <div className="w-full max-w-6xl rounded-xl border border-rule bg-paper p-2 text-ink shadow-lg sm:rounded-2xl">
        <div className="flex flex-col gap-2 sm:flex-row">
          <span className="self-start rounded-lg border-2 border-accent/50 px-2 py-1 text-center font-mono text-xs font-bold text-accent uppercase sm:rounded-xl sm:text-sm sm:content-center sm:self-auto sm:py-0">
            {t.agents.tryItOut}
          </span>
          <CopyableCommand
            command="npx -y @team-ops/mcp"
            className="min-w-0 flex-1"
            copiedLabel={t.agents.copied}
            copyLabel={t.agents.copy}
            copyAria={t.agents.copyAria}
            copiedAria={t.agents.copiedAria}
          />
        </div>
        <p className="mt-2 px-1 text-[0.875rem] leading-relaxed text-muted sm:text-[0.95rem]">
          <InlineMarkup text={t.agents.needs} />{" "}
          <a href={GITHUB} className="text-ink underline underline-offset-2">
            {t.agents.runStackFirst}
          </a>
          .
        </p>
        <div className="relative mt-2 rounded-xl border border-rule bg-paper-2 shadow-md">
          <div className="flex flex-row items-center gap-2 border-b border-rule p-2 text-muted">
            <TerminalIcon className="size-4" />
            <span className="text-xs font-medium">{t.agents.terminal}</span>
            <div className="ms-auto me-2 size-2 rounded-full bg-red-400" />
          </div>
          <CreateAppAnimation status={t.agents.inProgress} className="p-2 text-ink-2/80" />
        </div>
      </div>

      <div className="w-full max-w-6xl rounded-xl border border-rule bg-paper p-4 text-[1rem] leading-relaxed text-ink-2 sm:rounded-2xl sm:p-5 sm:text-[1.125rem] lg:p-6">
        <p>{t.agents.caption}</p>
      </div>
    </div>
  );
}
