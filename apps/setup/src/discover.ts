import type { DiscoverResult } from "./types.js";

type Organization = { id: string; name: string };
type Project = { id: string; key: string; name: string };

async function apiGet<T>(baseUrl: string, token: string, path: string): Promise<T> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const json = (await res.json()) as {
    data?: T;
    error?: { code: string; message: string };
  };
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  }
  return json.data as T;
}

export async function discoverWorkspace(url: string, token: string): Promise<DiscoverResult | null> {
  const orgs = await apiGet<Organization[]>(url, token, "/organizations");
  if (!orgs.length) return null;
  const org = orgs[0];
  const projects = await apiGet<Project[]>(url, token, `/projects?organizationId=${org.id}`);
  const project = projects[0];
  return {
    organizationId: org.id,
    organizationName: org.name,
    projectId: project?.id,
    projectKey: project?.key,
    projectName: project?.name,
  };
}

export async function checkConnection(url: string, token: string) {
  const res = await fetch(`${url.replace(/\/$/, "")}/healthz`);
  if (!res.ok) {
    throw new Error(`Health check failed: HTTP ${res.status}`);
  }
  await apiGet(url, token, "/organizations");
}
