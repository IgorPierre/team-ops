"use client";

import { Select } from "@/components/ui/select";
import { useT } from "@/lib/i18n";
import { useWorkspace } from "@/providers/workspace-provider";

/** Project filter. Empty value means every project. */
export function ProjectSelect({
  value,
  onChange,
  className,
  size,
  allLabel,
}: {
  value: string;
  onChange: (projectId: string) => void;
  className?: string;
  size?: "sm" | "md";
  allLabel?: string;
}) {
  const t = useT();
  const { projects } = useWorkspace();
  return (
    <Select
      size={size}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t("Project")}
    >
      <option value="">{allLabel ? t(allLabel) : t("All projects")}</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.key} · {project.name}
        </option>
      ))}
    </Select>
  );
}
