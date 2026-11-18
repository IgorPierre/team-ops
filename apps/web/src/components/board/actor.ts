import type { Member } from "@team-ops/api-client";

import { translate } from "@/lib/i18n";

/** Display name for whoever did something on a task: a person, an agent or the system. */
export function actorName(
  type: string | null | undefined,
  id: string | null | undefined,
  names: Map<string, Member>,
) {
  if (type === "agent") return translate("Agent");
  if (!id) return translate("System");
  return names.get(id)?.name ?? translate("Someone");
}
