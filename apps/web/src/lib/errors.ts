import { TeamOpsError } from "@team-ops/api-client";

import { translate } from "@/lib/i18n";

/** Message safe to show the user: the API's own message, or a fallback. */
export function errorMessage(error: unknown, fallback = translate("Something went wrong")) {
  if (error instanceof TeamOpsError) return translate(error.message);
  if (error instanceof Error && error.message) return translate(error.message);
  return fallback;
}

/** Only follow same-origin relative paths after sign-in. */
export function safeNextPath(next: string | null, fallback = "/") {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}
