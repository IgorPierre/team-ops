"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Non-secure context or permission denied — fail silently.
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-rule bg-paper-2 py-1.5 pr-1.5 pl-4 font-mono text-base text-muted shadow-sm",
        className,
      )}
    >
      <code className="min-w-0 flex-1 truncate">{command}</code>
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
          "inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors",
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
