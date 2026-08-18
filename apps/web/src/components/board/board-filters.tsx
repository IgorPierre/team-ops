"use client";

import type { Member } from "@team-ops/api-client";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface BoardFilterState {
  search: string;
  priority: string;
  assigneeId: string;
}

export function BoardFilters({
  members,
  value,
  onChange,
}: {
  members: Member[];
  value: BoardFilterState;
  onChange: (next: BoardFilterState) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4" />
        <Input
          className="bg-background pl-8"
          placeholder="Search tasks"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>
      <Select
        value={value.priority}
        onChange={(e) => onChange({ ...value, priority: e.target.value })}
        aria-label="Priority"
      >
        <option value="">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </Select>
      <Select
        value={value.assigneeId}
        onChange={(e) => onChange({ ...value, assigneeId: e.target.value })}
        aria-label="Assignee"
      >
        <option value="">Anyone</option>
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
