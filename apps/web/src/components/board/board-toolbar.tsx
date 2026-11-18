"use client";

import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MemberSelect } from "@/components/workspace/member-select";
import { ProjectSelect } from "@/components/workspace/project-select";
import { useT } from "@/lib/i18n";
import { PRIORITIES, PRIORITY_DISPLAY } from "@/lib/task-display";

export interface BoardFilterState {
  project: string;
  search: string;
  priority: string;
  assignee: string;
}

export const EMPTY_BOARD_FILTERS: BoardFilterState = { project: "", search: "", priority: "", assignee: "" };

export function BoardToolbar({
  value,
  onChange,
}: {
  value: BoardFilterState;
  onChange: (patch: Partial<BoardFilterState>) => void;
}) {
  const t = useT();
  const active = Boolean(value.search || value.priority || value.assignee || value.project);

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 md:px-6">
      <Input
        leadingIcon={SearchIcon}
        type="search"
        placeholder={t("Search tasks")}
        aria-label={t("Search tasks")}
        size="sm"
        className="sm:w-64"
        value={value.search}
        onChange={(e) => onChange({ search: e.target.value })}
      />
      <ProjectSelect size="sm" className="sm:w-48" value={value.project} onChange={(project) => onChange({ project })} />
      <Select
        size="sm"
        className="sm:w-44"
        aria-label={t("Priority")}
        value={value.priority}
        onChange={(e) => onChange({ priority: e.target.value })}
      >
        <option value="">{t("Any priority")}</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {t(PRIORITY_DISPLAY[p].label)}
          </option>
        ))}
      </Select>
      <MemberSelect
        size="sm"
        className="sm:w-40"
        label={t("Assignee")}
        allLabel={t("Anyone")}
        value={value.assignee}
        onChange={(assignee) => onChange({ assignee })}
      />
      {active ? (
        <Button variant="ghost" onClick={() => onChange(EMPTY_BOARD_FILTERS)}>
          <XIcon />
          {t("Clear")}
        </Button>
      ) : null}
    </div>
  );
}
