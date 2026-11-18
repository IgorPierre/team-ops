"use client";

import { CodeIcon, MousePointer2Icon, PackageIcon, ShieldCheckIcon, TerminalIcon, type LucideIcon } from "lucide-react";
import { Fragment, useState } from "react";

import { CopyField } from "@/components/ui/copy-field";
import { focusRing } from "@/components/ui/styles";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Editor = "claude" | "cursor" | "vscode" | "setup";

const EDITORS: {
  value: Editor;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  {
    value: "claude",
    label: "Claude Code",
    hint: "Terminal",
    icon: TerminalIcon,
  },
  {
    value: "cursor",
    label: "Cursor",
    hint: "mcp.json",
    icon: MousePointer2Icon,
  },
  { value: "vscode", label: "VS Code", hint: "Copilot agent", icon: CodeIcon },
  {
    value: "setup",
    label: "Setup CLI",
    hint: "Any editor + skill",
    icon: PackageIcon,
  },
];

function EditorPicker({ value, onChange }: { value: Editor; onChange: (value: Editor) => void }) {
  const t = useT();
  return (
    <div role="radiogroup" aria-label={t("Editor")} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {EDITORS.map(({ value: option, label, hint, icon: Icon }) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-[background-color,border-color,box-shadow]",
              selected
                ? "border-primary bg-card ring-primary/15 ring-[3px] dark:bg-accent"
                : "bg-card hover:bg-muted/50 dark:bg-transparent dark:hover:bg-accent",
              focusRing,
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-foreground text-sm font-medium">{t(label)}</span>
              <span className="text-muted-foreground text-xs">{t(hint)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Vertical stepper: numbered dots joined by a line. */
function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="flex list-none flex-col [counter-reset:step]">{children}</ol>;
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <li
      className={cn(
        "relative flex gap-3 pb-5 [counter-increment:step] last:pb-0",
        "before:bg-muted before:text-foreground before:z-[1] before:flex before:size-6 before:shrink-0 before:items-center before:justify-center before:rounded-full before:text-xs before:font-semibold before:content-[counter(step)]",
        "after:bg-border after:absolute after:top-7 after:bottom-1 after:left-3 after:w-px last:after:hidden",
      )}
    >
      <div className="text-foreground/80 flex min-w-0 flex-1 flex-col gap-2 pt-0.5 text-sm">{children}</div>
    </li>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-xs tracking-normal">{children}</code>
  );
}

/** Fills `{name}` slots in an already translated sentence with inline elements. */
function rich(text: string, parts: Record<string, React.ReactNode>) {
  return text.split(/\{(\w+)\}/g).map((chunk, i) => (i % 2 ? <Fragment key={i}>{parts[chunk]}</Fragment> : chunk));
}

/** Pick an editor, then follow its steps to add the Team-Ops MCP server at `url`. */
export function ConnectAgent({ url }: { url: string }) {
  const t = useT();
  const allow = <strong>{t("Allow")}</strong>;
  const server = <strong>team-ops</strong>;
  const [editor, setEditor] = useState<Editor>("claude");
  const cursorJson = JSON.stringify({ mcpServers: { "team-ops": { url } } }, null, 2);
  const vscodeJson = JSON.stringify({ servers: { "team-ops": { type: "http", url } } }, null, 2);

  return (
    <div className="flex flex-col gap-5">
      <EditorPicker value={editor} onChange={setEditor} />

      {editor === "claude" ? (
        <Steps>
          <Step>
            <p>{rich(t("In the repo you code in (add {flag} for every repo):"), { flag: <Code>--scope user</Code> })}</p>
            <CopyField value={`claude mcp add --transport http team-ops ${url}`} />
          </Step>
          <Step>
            <p>
              {rich(t("Run {command}, pick {server} and choose {action}."), {
                command: <Code>/mcp</Code>,
                server,
                action: <strong>Authenticate</strong>,
              })}
            </p>
          </Step>
          <Step>
            <p>{rich(t("Your browser opens Team-Ops. Click {allow}."), { allow })}</p>
          </Step>
        </Steps>
      ) : null}
      {editor === "cursor" ? (
        <Steps>
          <Step>
            <p>
              {rich(t("Add to {file} (or {globalFile} for every repo):"), {
                file: <Code>.cursor/mcp.json</Code>,
                globalFile: <Code>~/.cursor/mcp.json</Code>,
              })}
            </p>
            <CopyField value={cursorJson} />
          </Step>
          <Step>
            <p>{rich(t("In Cursor Settings → MCP, use the sign-in prompt next to {server}."), { server })}</p>
          </Step>
          <Step>
            <p>{rich(t("Click {allow} in the browser."), { allow })}</p>
          </Step>
        </Steps>
      ) : null}
      {editor === "vscode" ? (
        <Steps>
          <Step>
            <p>{rich(t("Add to {file} in the repo:"), { file: <Code>.vscode/mcp.json</Code> })}</p>
            <CopyField value={vscodeJson} />
          </Step>
          <Step>
            <p>
              {rich(t("Start the server from the file (or {command}) and sign in when asked."), {
                command: <em>MCP: List Servers</em>,
              })}
            </p>
          </Step>
          <Step>
            <p>{rich(t("Click {allow} in the browser, then use Copilot in agent mode."), { allow })}</p>
          </Step>
        </Steps>
      ) : null}
      {editor === "setup" ? (
        <Steps>
          <Step>
            <p>
              {rich(t("In the repo you code in. Writes the MCP config, {file} and the Team-Ops skill:"), {
                file: <Code>.team-ops.json</Code>,
              })}
            </p>
            <CopyField value={`npx @team-ops/setup --url ${url.replace(/\/mcp$/, "")}`} />
          </Step>
          <Step>
            <p>{t("Restart the editor and sign in when it asks.")}</p>
          </Step>
        </Steps>
      ) : null}

      <p className="text-muted-foreground flex gap-2 border-t pt-4 text-xs">
        <ShieldCheckIcon className="text-theme mt-px size-4 shrink-0" aria-hidden="true" />
        <span>
          {t(
            "No keys to copy. The editor signs in as you and its cards are assigned to you; the config has no secrets, so you can commit it for the team.",
          )}
        </span>
      </p>
    </div>
  );
}
