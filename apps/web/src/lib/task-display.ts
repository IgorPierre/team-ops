import type { Priority, Role, TaskStatus } from "@team-ops/api-client";

import type { BadgeColor } from "@/components/ui/badge";

/** One place for how task fields look, so the board, drawer, timeline and reports agree. */

export const PRIORITY_DISPLAY: Record<Priority, { label: string; color: BadgeColor }> = {
  high: { label: "High", color: "error" },
  medium: { label: "Medium", color: "warning" },
  low: { label: "Low", color: "gray" },
};

export const STATUS_DISPLAY: Record<TaskStatus, { label: string; color: BadgeColor }> = {
  backlog: { label: "Backlog", color: "gray" },
  in_progress: { label: "In progress", color: "blue" },
  review: { label: "In review", color: "yellow" },
  done: { label: "Done", color: "success" },
};

export const ROLE_DISPLAY: Record<Role, { label: string; color: BadgeColor; description: string }> = {
  admin: { label: "Admin", color: "brand", description: "Manages people, agents and settings" },
  developer: { label: "Developer", color: "blue", description: "Writes the board and runs coding agents" },
  viewer: { label: "Viewer", color: "gray", description: "Reads the board" },
};

export const ROLES = Object.keys(ROLE_DISPLAY) as Role[];
export const PRIORITIES = ["high", "medium", "low"] as const satisfies readonly Priority[];
