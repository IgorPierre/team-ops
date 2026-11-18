"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { api } from "@/lib/api";
import { contributionsFromActivity } from "@/lib/timeline";

/**
 * A person's daily contributions over the last year: their own actions plus,
 * optionally, those of every agent they own.
 */
export function usePersonActivity({
  orgId,
  userId,
  projectId,
  includeAgents,
}: {
  orgId?: string;
  userId: string;
  projectId: string;
  includeAgents: boolean;
}) {
  const agents = useQuery({
    queryKey: ["agents", orgId],
    queryFn: () => api.listAgents(orgId!),
    enabled: Boolean(orgId),
    retry: false,
  });
  const ownAgents = useMemo(
    () => (agents.data ?? []).filter((agent) => agent.developerId === userId),
    [agents.data, userId],
  );

  const actorIds = useMemo(
    () => [userId, ...(includeAgents ? ownAgents.map((a) => a.id) : [])],
    [userId, includeAgents, ownAgents],
  );

  return useQueries({
    queries: actorIds.map((actorId) => ({
      queryKey: ["org-activity", orgId, projectId, actorId],
      queryFn: () =>
        api.listOrganizationActivity({
          organizationId: orgId!,
          projectId: projectId || undefined,
          actorId,
          days: 371,
        }),
      enabled: Boolean(orgId),
    })),
    combine: (feeds) => ({
      ownAgents,
      loading: feeds.some((f) => f.isLoading),
      contributions: contributionsFromActivity(feeds.flatMap((f) => f.data ?? [])),
    }),
  });
}
