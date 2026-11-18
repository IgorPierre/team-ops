import type { Role } from "@team-ops/api-client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { ROLE_DISPLAY } from "@/lib/task-display";

export function RoleBadge({ role }: { role: Role }) {
  const t = useT();
  const display = ROLE_DISPLAY[role];
  return <Badge color={display.color}>{t(display.label)}</Badge>;
}
