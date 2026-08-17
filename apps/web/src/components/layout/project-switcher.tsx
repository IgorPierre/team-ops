"use client";

import type { Project } from "@team-ops/api-client";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export const ALL_PROJECTS = "";

export function ProjectSwitcher({
  projects,
  value,
  onChange,
}: {
  projects: Project[];
  value?: string;
  onChange: (id: string) => void;
}) {
  const current = projects.find((project) => project.id === value);
  return (
    <label className="relative">
      <Button variant="ghost" className="max-w-52 justify-between" asChild>
        <span>
          <span className="truncate">{current ? current.name : "All projects"}</span>
          <ChevronDownIcon />
        </span>
      </Button>
      <select
        className="absolute inset-0 cursor-pointer opacity-0"
        value={value ?? ALL_PROJECTS}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Project"
      >
        <option value={ALL_PROJECTS}>All projects</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.key} · {project.name}
          </option>
        ))}
      </select>
    </label>
  );
}
