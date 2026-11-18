"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

/** How new accounts are created on this instance. Falls back to invite-only on error. */
export function useRegistrationMode() {
  const config = useQuery({
    queryKey: ["auth-config"],
    queryFn: () => api.authConfig(),
    retry: false,
    staleTime: Infinity,
  });
  if (config.isError) return "invite_only" as const;
  return config.data?.registration ?? null;
}
