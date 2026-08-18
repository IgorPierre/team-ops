"use client";

import type { Organization } from "@team-ops/api-client";

import { Select } from "@/components/ui/select";

export function OrganizationSwitcher({
  organizations,
  value,
  onChange,
  className,
}: {
  organizations: Organization[];
  value?: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <Select
      className={className}
      value={value ?? ""}
      onChange={(e) => {
        if (e.target.value) onChange(e.target.value);
      }}
      aria-label="Organization"
    >
      {organizations.length === 0 ? <option value="">Organization</option> : null}
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </Select>
  );
}
