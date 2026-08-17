export type TaskStatus = "backlog" | "in_progress" | "review" | "done";
export type Priority = "low" | "medium" | "high";
export type Source = "manual" | "ai" | "integration";
export type Role = "admin" | "developer" | "viewer";

export interface Envelope<T> {
  data: T;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  role?: Role;
  createdAt: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: Role;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string;
  createdAt: string;
}

export interface Task {
  id: string;
  number: number;
  key: string;
  organizationId: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string | null;
  reporterId?: string | null;
  dueDate?: string | null;
  position: string;
  blocked: boolean;
  blockedReason?: string | null;
  source: Source;
  externalRef?: string | null;
  sourceMetadata: Record<string, unknown>;
  completionSummary?: string | null;
  version: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorType: "user" | "agent" | "system";
  authorId?: string | null;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Activity {
  id: string;
  taskId: string;
  actorType: string;
  actorId?: string | null;
  action: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  developerId?: string | null;
  organizationId?: string | null;
  description?: string | null;
  active: boolean;
  lastSeenAt?: string | null;
  createdAt: string;
}

export interface APIKey {
  id: string;
  agentId: string;
  name: string;
  prefix: string;
  scopes: string[];
  key?: string;
  createdAt: string;
}

export interface ListTasksQuery {
  organizationId: string;
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: Priority;
  blocked?: boolean;
  source?: Source;
  updatedAfter?: string;
  search?: string;
  externalRef?: string;
}

export class TeamOpsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "TeamOpsError";
  }
}

export interface ClientOptions {
  baseUrl: string;
  token?: string;
  credentials?: RequestCredentials;
  fetch?: typeof fetch;
}

export class TeamOpsClient {
  constructor(private readonly opts: ClientOptions) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | undefined>,
  ): Promise<T> {
    const url = new URL(
      `${this.opts.baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`,
    );
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== "") url.searchParams.set(k, v);
      }
    }
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (this.opts.token) headers.Authorization = `Bearer ${this.opts.token}`;
    const res = await (this.opts.fetch ?? fetch)(url, {
      method,
      headers,
      credentials: this.opts.credentials ?? (this.opts.token ? "omit" : "include"),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json()) as Envelope<T>;
    if (!res.ok || json.error) {
      throw new TeamOpsError(
        json.error?.code ?? "HTTP_ERROR",
        json.error?.message ?? res.statusText,
        res.status,
      );
    }
    return json.data;
  }

  register(body: { name: string; email: string; password: string }) {
    return this.request<User>("POST", "/auth/register", body);
  }
  login(body: { email: string; password: string }) {
    return this.request<User>("POST", "/auth/login", body);
  }
  logout() {
    return this.request<{ ok: boolean }>("POST", "/auth/logout");
  }
  me() {
    return this.request<User>("GET", "/auth/me");
  }

  listOrganizations() {
    return this.request<Organization[]>("GET", "/organizations");
  }
  createOrganization(body: { name: string; slug: string; color?: string }) {
    return this.request<Organization>("POST", "/organizations", body);
  }
  listMembers(orgId: string) {
    return this.request<Member[]>("GET", `/organizations/${orgId}/members`);
  }
  addMember(orgId: string, body: { email: string; role: Role }) {
    return this.request<Member>("POST", `/organizations/${orgId}/members`, body);
  }

  listProjects(organizationId: string) {
    return this.request<Project[]>("GET", "/projects", undefined, { organizationId });
  }
  createProject(body: {
    organizationId: string;
    name: string;
    key: string;
    description?: string;
  }) {
    return this.request<Project>("POST", "/projects", body);
  }

  listTasks(query: ListTasksQuery) {
    return this.request<Task[]>("GET", "/tasks", undefined, {
      organizationId: query.organizationId,
      projectId: query.projectId,
      assigneeId: query.assigneeId,
      status: query.status,
      priority: query.priority,
      blocked: query.blocked === undefined ? undefined : String(query.blocked),
      source: query.source,
      updatedAfter: query.updatedAfter,
      search: query.search,
      externalRef: query.externalRef,
    });
  }
  getTask(id: string) {
    return this.request<Task>("GET", `/tasks/${id}`);
  }
  createTask(body: Record<string, unknown>) {
    return this.request<Task>("POST", "/tasks", body);
  }
  updateTask(id: string, body: Record<string, unknown>) {
    return this.request<Task>("PATCH", `/tasks/${id}`, body);
  }
  moveTask(
    id: string,
    body: { status: TaskStatus; position?: string; expectedVersion: number },
  ) {
    return this.request<Task>("POST", `/tasks/${id}/move`, body);
  }
  reportProgress(id: string, body: Record<string, unknown>) {
    return this.request<Task>("POST", `/tasks/${id}/progress`, body);
  }
  addComment(id: string, body: { content: string; metadata?: Record<string, unknown> }) {
    return this.request<Comment>("POST", `/tasks/${id}/comments`, body);
  }
  listComments(id: string) {
    return this.request<Comment[]>("GET", `/tasks/${id}/comments`);
  }
  blockTask(id: string, body: { reason: string; expectedVersion: number }) {
    return this.request<Task>("POST", `/tasks/${id}/block`, body);
  }
  unblockTask(id: string, body: { expectedVersion: number }) {
    return this.request<Task>("POST", `/tasks/${id}/unblock`, body);
  }
  requestReview(id: string, body: Record<string, unknown>) {
    return this.request<Task>("POST", `/tasks/${id}/review`, body);
  }
  completeTask(
    id: string,
    body: {
      completionSummary: string;
      acceptanceCriteriaMet: boolean;
      expectedVersion: number;
    },
  ) {
    return this.request<Task>("POST", `/tasks/${id}/complete`, body);
  }
  archiveTask(id: string, body: { expectedVersion: number }) {
    return this.request<{ ok: boolean }>("POST", `/tasks/${id}/archive`, body);
  }
  listActivities(id: string) {
    return this.request<Activity[]>("GET", `/tasks/${id}/activities`);
  }

  listAgents(organizationId: string) {
    return this.request<Agent[]>("GET", "/agents", undefined, { organizationId });
  }
  createAgent(body: { organizationId: string; name: string; description?: string }) {
    return this.request<Agent>("POST", "/agents", body);
  }
  listAPIKeys(agentId: string) {
    return this.request<APIKey[]>("GET", `/agents/${agentId}/api-keys`);
  }
  createAPIKey(agentId: string, body: { name?: string; scopes?: string[] } = {}) {
    return this.request<APIKey>("POST", `/agents/${agentId}/api-keys`, body);
  }
  revokeAPIKey(agentId: string, keyId: string) {
    return this.request<{ ok: boolean }>(
      "DELETE",
      `/agents/${agentId}/api-keys/${keyId}`,
    );
  }
}

export function createClient(opts: ClientOptions) {
  return new TeamOpsClient(opts);
}
