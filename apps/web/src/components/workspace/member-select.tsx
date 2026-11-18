"use client";

import { Select } from "@/components/ui/select";
import { useT } from "@/lib/i18n";
import { UNASSIGNED } from "@/lib/timeline";
import { useWorkspace } from "@/providers/workspace-provider";

/** Person filter. Empty value means everyone. */
export function MemberSelect({
  value,
  onChange,
  className,
  size,
  allLabel,
  includeUnassigned = false,
  label,
}: {
  value: string;
  onChange: (userId: string) => void;
  className?: string;
  size?: "sm" | "md";
  allLabel?: string;
  /** Offer an "Unassigned" option (value {@link UNASSIGNED}). */
  includeUnassigned?: boolean;
  label?: string;
}) {
  const t = useT();
  const { members } = useWorkspace();
  return (
    <Select
      size={size}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label ? t(label) : t("Person")}
    >
      <option value="">{allLabel ? t(allLabel) : t("Everyone")}</option>
      {includeUnassigned ? <option value={UNASSIGNED}>{t("Unassigned")}</option> : null}
      {members.map((member) => (
        <option key={member.userId} value={member.userId}>
          {member.name}
        </option>
      ))}
    </Select>
  );
}
