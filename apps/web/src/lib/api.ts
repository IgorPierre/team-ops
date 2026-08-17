import { TeamOpsClient } from "@team-ops/api-client";

export const api = new TeamOpsClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE ?? "/v1",
  credentials: "include",
});
