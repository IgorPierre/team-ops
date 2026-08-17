"use client";

import type { Member } from "@team-ops/api-client";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

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
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute top-2.5 left-2 size-4" />
        <Input
          className="w-56 pl-8"
          placeholder="Search tasks"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>
      <select
        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
        value={value.priority}
        onChange={(e) => onChange({ ...value, priority: e.target.value })}
        aria-label="Priority"
      >
        <option value="">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select
        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
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
      </select>
    </div>
  );
}
