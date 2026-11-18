"use client";

import type { Member } from "@team-ops/api-client";
import { useMemo } from "react";

/** O(1) member lookups by user id, plus a display-name helper. */
export function useMemberDirectory(members: Member[]) {
  return useMemo(() => {
    const byId = new Map(members.map((m) => [m.userId, m]));
    return {
      byId,
      get: (id?: string | null) => (id ? byId.get(id) : undefined),
      nameOf: (id?: string | null, fallback = "Unassigned") =>
        id ? (byId.get(id)?.name ?? "Unknown") : fallback,
    };
  }, [members]);
}

export type MemberDirectory = ReturnType<typeof useMemberDirectory>;
