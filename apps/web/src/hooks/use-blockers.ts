"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useWorkspace } from "@/providers/workspace-provider";

export function useBlockers(enabled = true) {
  const { orgId } = useWorkspace();
  return useQuery({
    queryKey: ["tasks", "blockers", orgId],
    queryFn: () => api.listTasks({ organizationId: orgId!, blocked: true }),
    enabled: Boolean(orgId) && enabled,
    refetchInterval: 30_000,
  });
}
