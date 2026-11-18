"use client";

import type { TaskProof } from "@team-ops/api-client";
import { ArrowUpRightIcon } from "lucide-react";

import { useT } from "@/lib/i18n";
import { proofKindMeta, proofText } from "@/lib/proof";
import { cn } from "@/lib/utils";

/** A done card's evidence: source icon + short link ("api#42"), or "No source". */
export function ProofLink({ proof, className }: { proof: TaskProof; className?: string }) {
  const t = useT();
  const meta = proofKindMeta(proof.kind);
  const Icon = meta.icon;
  const text = proofText(proof);

  if (!proof.url || !text) {
    return (
      <span className={cn("text-muted-foreground inline-flex min-w-0 items-center gap-2 text-sm", className)}>
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{t("No source · planning")}</span>
      </span>
    );
  }

  return (
    <a
      href={proof.url}
      target="_blank"
      rel="noreferrer noopener"
      title={proof.url}
      aria-label={t("{source}: {link}", { source: t(meta.label), link: text })}
      // The card opens the drawer and is draggable; the link should do neither.
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "group/proof text-foreground inline-flex min-w-0 items-center gap-2 text-sm hover:underline",
        className,
      )}
    >
      <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{text}</span>
      <ArrowUpRightIcon
        className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover/proof:opacity-100"
        aria-hidden="true"
      />
    </a>
  );
}
