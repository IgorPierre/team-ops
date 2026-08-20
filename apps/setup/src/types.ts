export type Editor = "cursor" | "claude" | "vscode";
export type Scope = "project" | "global";

export type TeamOpsConfig = {
  url: string;
  organizationId?: string;
  organizationName?: string;
  projectId?: string;
  projectKey?: string;
  projectName?: string;
  autoUpdate: boolean;
};

export type SetupOptions = {
  cwd: string;
  editor: Editor;
  scope: Scope;
  url: string;
  token: string;
  checkOnly: boolean;
  yes: boolean;
  skipSkill: boolean;
  skipMcp: boolean;
  skipConfig: boolean;
};

export type DiscoverResult = {
  organizationId: string;
  organizationName: string;
  projectId?: string;
  projectKey?: string;
  projectName?: string;
};
