"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/styles";

export function CopyableCommand({
  command,
  className,
  copiedLabel = "Copied",
  copyLabel = "Copy",
  copyAria = "Copy command",
  copiedAria = "Copied to clipboard",
}: {
  command: string;
  className?: string;
  copiedLabel?: string;
  copyLabel?: string;
  copyAria?: string;
  copiedAria?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      // Clipboard can fail in non-secure contexts.
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-xl border border-rule bg-paper-2 py-1 pr-1 pl-3 font-mono text-sm text-muted shadow-sm sm:gap-2 sm:rounded-xl sm:py-1.5 sm:pr-1.5 sm:pl-4 sm:text-base",
        className,
      )}
    >
      <code className="min-w-0 flex-1 break-all text-sm sm:truncate sm:text-base">{command}</code>
      <span
        aria-hidden="true"
        className={cn(
          "hidden shrink-0 text-xs font-medium text-accent sm:inline-block",
          "transition-opacity duration-200",
          copied ? "opacity-100" : "opacity-0",
        )}
      >
        {copiedLabel}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? copiedAria : copyAria}
        title={copied ? copiedLabel : copyLabel}
        className={cn(
          "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md p-2 text-muted transition-colors",
          "hover:bg-paper-3 hover:text-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        )}
      >
        {copied ? (
          <CheckIcon className="size-4 text-accent" aria-hidden="true" />
        ) : (
          <CopyIcon className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
