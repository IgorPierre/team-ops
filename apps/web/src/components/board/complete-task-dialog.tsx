"use client";

import type { ProofKind, Task, TaskProof } from "@team-ops/api-client";
import { CircleCheckIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { focusRing } from "@/components/ui/styles";
import { useT } from "@/lib/i18n";
import { PROOF_KINDS, detectProofKind, isProofUrl, proofKindMeta } from "@/lib/proof";
import { cn } from "@/lib/utils";

/**
 * Asked when a card moves to Done: where can the finished work be checked?
 * A GitHub PR, a Vercel deploy, a Supabase change, any other link, or
 * nothing for planning and research.
 */
export function CompleteTaskDialog({
  task,
  onConfirm,
  onCancel,
}: {
  /** The card being completed; the dialog is open while it is set. */
  task: Task | null;
  onConfirm: (proof: TaskProof) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const urlId = useId();
  const [kind, setKind] = useState<ProofKind>("github");
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!task) return;
    setKind(task.proof?.kind ?? "github");
    setUrl(task.proof?.url ?? "");
    setTouched(false);
  }, [task]);

  const needsUrl = kind !== "none";
  const valid = !needsUrl || isProofUrl(url);
  const meta = proofKindMeta(kind);

  function submit() {
    setTouched(true);
    if (!valid) return;
    onConfirm(needsUrl ? { kind, url: url.trim() } : { kind });
  }

  return (
    <Dialog open={Boolean(task)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <DialogHeader
            icon={<CircleCheckIcon />}
            title={t("Complete {key}", { key: task?.key ?? "" })}
            description={t("Where can the finished work be checked? The link stays on the card for anyone reviewing it.")}
          />
          <DialogBody className="gap-5">
            <div role="radiogroup" aria-label={t("proof|Source")} className="grid grid-cols-2 gap-2">
              {PROOF_KINDS.map(({ value, label, hint, icon: Icon }) => {
                const selected = value === kind;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setKind(value)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-[background-color,border-color,box-shadow]",
                      value === "none" && "col-span-2",
                      selected
                        ? "border-primary bg-card ring-primary/15 dark:bg-accent ring-[3px]"
                        : "bg-card hover:bg-muted/50 dark:hover:bg-accent dark:bg-transparent",
                      focusRing,
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md",
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-foreground truncate text-sm font-medium">{t(label)}</span>
                      <span className="text-muted-foreground truncate text-xs">{t(hint)}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {needsUrl ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor={urlId}>{t("Link")}</Label>
                <Input
                  id={urlId}
                  type="url"
                  inputMode="url"
                  autoFocus
                  placeholder={meta.placeholder}
                  value={url}
                  aria-invalid={touched && !valid}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    // Pasting a PR picks GitHub, a deploy Vercel, and so on.
                    const detected = detectProofKind(e.target.value);
                    if (detected && detected !== "other") setKind(detected);
                  }}
                />
                {touched && !valid ? (
                  <p className="text-destructive text-xs">{t("Paste a link starting with https://")}</p>
                ) : null}
              </div>
            ) : (
              <p className="bg-muted/50 text-muted-foreground rounded-lg px-3 py-2.5 text-sm">
                {t("The card is marked done without a link. Use it for work that has nothing to show, like planning or research.")}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onCancel}>
              {t("Cancel")}
            </Button>
            <Button type="submit">
              <CircleCheckIcon />
              {t("Mark as done")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
