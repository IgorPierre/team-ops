export type Editor = "cursor" | "claude" | "vscode";
export type Scope = "project" | "global";

/** Committed to the repo: which Team-Ops and which board project it reports to. No secrets. */
export type TeamOpsConfig = {
  url: string;
  projectKey?: string;
  autoUpdate: boolean;
};

export type SetupOptions = {
  cwd: string;
  editor: Editor;
  scope: Scope;
  /** Public Team-Ops URL (what people open in the browser). */
  url: string;
  /** Board project key for this repo (e.g. API). */
  projectKey?: string;
  checkOnly: boolean;
  yes: boolean;
  skipSkill: boolean;
  skipMcp: boolean;
  skipConfig: boolean;
};

/** How an editor expects its MCP config entry to be shaped. */
export type McpFormat = Editor;
export type McpTarget = { path: string; format: McpFormat };
