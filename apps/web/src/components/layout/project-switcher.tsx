"use client";

import type { Project } from "@team-ops/api-client";

import { Select } from "@/components/ui/select";

export const ALL_PROJECTS = "";

export function ProjectSwitcher({
  projects,
  value,
  onChange,
  className,
}: {
  projects: Project[];
  value?: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <Select
      className={className}
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
    </Select>
  );
}
