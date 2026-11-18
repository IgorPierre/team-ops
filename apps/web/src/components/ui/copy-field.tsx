"use client";

import { CheckIcon, CopyIcon } from "lucide-react";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { Button } from "./button";

/** Read-only snippet (command, URL, JSON) with a copy button. */
export function CopyField({ value, className }: { value: string; className?: string }) {
  const { copied, copy } = useCopyToClipboard();
  const t = useT();
  return (
    <div
      className={cn(
        "bg-muted text-foreground relative rounded-md border py-2 pr-11 pl-3 font-mono text-xs leading-relaxed tracking-normal",
        className,
      )}
    >
      <pre className="m-0 overflow-x-auto whitespace-pre pb-1">{value}</pre>
      <Button
        variant="tertiary"
        size="icon"
        className="absolute top-1 right-1"
        aria-label={copied ? t("Copied") : t("Copy")}
        onClick={() => void copy(value)}
      >
        {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
      </Button>
    </div>
  );
}
