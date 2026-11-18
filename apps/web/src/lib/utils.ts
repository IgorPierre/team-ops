import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { intlLocale, translate } from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatDue(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(intlLocale(), { day: "numeric", month: "short" });
}

export function formatDueRelative(value?: string | null, status?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  const formatted = date.toLocaleDateString(intlLocale(), { day: "numeric", month: "short" });
  if (status === "done") return translate("Due {date}", { date: formatted });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) {
    const n = Math.abs(days);
    return n === 1 ? translate("1 day overdue") : translate("{n} days overdue", { n });
  }
  if (days === 0) return translate("Due today");
  if (days === 1) return translate("1 day remaining");
  return translate("{n} days remaining", { n: days });
}

/** Open work whose due date is before today (local time). */
export function isOverdue(value?: string | null, status?: string) {
  if (!value || status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${value}T00:00:00`).getTime() < today.getTime();
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(intlLocale(), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
