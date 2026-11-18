"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { TeamOpsError, type Member, type Organization, type Project, type User } from "@team-ops/api-client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

const ORG_KEY = "teamops.org";

function readStoredOrg(): string | undefined {
  try {
    return window.localStorage.getItem(ORG_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function storeOrg(id: string) {
  try {
    window.localStorage.setItem(ORG_KEY, id);
  } catch {
    /* private mode: the choice just won't stick */
  }
}

interface WorkspaceValue {
  user: User;
  organizations: Organization[];
  org: Organization | undefined;
  orgId: string | undefined;
  setOrgId: (id: string) => void;
  projects: Project[];
  members: Member[];
  projectsQuery: UseQueryResult<Project[]>;
  membersQuery: UseQueryResult<Member[]>;
  isAdmin: boolean;
  canWrite: boolean;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

/**
 * Session, organizations, and the current organization's projects and
 * members, shared by every page inside the app shell. Redirects to /login on
 * 401 and to /onboarding when the user has no organization yet. The chosen
 * organization is remembered across visits.
 */
export function WorkspaceProvider({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  /** Rendered until the session is known. */
  fallback?: React.ReactNode;
}) {
  const router = useRouter();
  const [orgId, setOrgIdState] = useState<string>();

  const me = useQuery({ queryKey: ["me"], queryFn: () => api.me(), retry: false });
  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.listOrganizations(),
    enabled: me.isSuccess,
  });

  useEffect(() => {
    if (me.error instanceof TeamOpsError && me.error.status === 401) router.replace("/login?expired=1");
  }, [me.error, router]);

  useEffect(() => {
    if (!orgs.data) return;
    if (orgs.data.length === 0) {
      router.replace("/onboarding");
      return;
    }
    if (orgId && orgs.data.some((o) => o.id === orgId)) return;
    const stored = readStoredOrg();
    setOrgIdState(orgs.data.find((o) => o.id === stored)?.id ?? orgs.data[0].id);
  }, [orgId, orgs.data, router]);

  const setOrgId = useCallback((id: string) => {
    setOrgIdState(id);
    storeOrg(id);
  }, []);

  const projectsQuery = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => api.listProjects(orgId!),
    enabled: Boolean(orgId),
  });
  const membersQuery = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => api.listMembers(orgId!),
    enabled: Boolean(orgId),
  });

  const value = useMemo<WorkspaceValue | null>(() => {
    if (!me.data) return null;
    const org = orgs.data?.find((item) => item.id === orgId);
    return {
      user: me.data,
      organizations: orgs.data ?? [],
      org,
      orgId,
      setOrgId,
      projects: projectsQuery.data ?? [],
      members: membersQuery.data ?? [],
      projectsQuery,
      membersQuery,
      isAdmin: org?.role === "admin",
      canWrite: Boolean(org) && org?.role !== "viewer",
    };
  }, [me.data, orgs.data, orgId, setOrgId, projectsQuery, membersQuery]);

  if (!value) return <>{fallback}</>;
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return value;
}
