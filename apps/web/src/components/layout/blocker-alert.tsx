"use client";

import Link from "next/link";
import { OctagonAlertIcon } from "lucide-react";
import { useBlockers } from "@/hooks/use-blockers";
import { useT } from "@/lib/i18n";
import { useWorkspace } from "@/providers/workspace-provider";

export function BlockerAlert() {
  const { isAdmin } = useWorkspace();
  const blockers = useBlockers(isAdmin);
  const t = useT();
  if (!isAdmin || !blockers.data?.length) return null;
  return <Link href="/blockers" role="status"
    className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-destructive hover:bg-muted"
    aria-label={t("{n} pending blockers", { n: blockers.data.length })}>
    <OctagonAlertIcon className="size-4" aria-hidden="true" />
    <span>{blockers.data.length}</span>
    <span className="hidden sm:inline">{t("Pending items")}</span>
  </Link>;
}
