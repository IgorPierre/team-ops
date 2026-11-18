import type { Role } from "@team-ops/api-client";

import { Select } from "@/components/ui/select";
import { useT } from "@/lib/i18n";
import { ROLE_DISPLAY, ROLES } from "@/lib/task-display";

export function RoleSelect({
  value,
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Select>, "value" | "onChange"> & {
  value: Role;
  onChange: (role: Role) => void;
}) {
  const t = useT();
  return (
    <Select size="sm" className={className} value={value} onChange={(e) => onChange(e.target.value as Role)} {...props}>
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {t(ROLE_DISPLAY[role].label)}
        </option>
      ))}
    </Select>
  );
}
