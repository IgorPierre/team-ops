"use client";

import type { Organization } from "@team-ops/api-client";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function OrganizationSwitcher({
  organizations,
  value,
  onChange,
}: {
  organizations: Organization[];
  value?: string;
  onChange: (id: string) => void;
}) {
  const current = organizations.find((org) => org.id === value);
  return (
    <label className="relative">
      <Button variant="ghost" className="max-w-48 justify-between" asChild>
        <span>
          <span className="truncate">{current?.name ?? "Organization"}</span>
          <ChevronDownIcon />
        </span>
      </Button>
      <select
        className="absolute inset-0 cursor-pointer opacity-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Organization"
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </label>
  );
}
