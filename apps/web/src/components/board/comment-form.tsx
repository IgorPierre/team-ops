"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n";

export function CommentForm({ taskId, onCreated }: { taskId: string; onCreated: () => void }) {
  const t = useT();
  const [content, setContent] = useState("");
  const mutation = useMutation({
    mutationFn: () => api.addComment(taskId, { content }),
    onSuccess: () => {
      setContent("");
      onCreated();
    },
    onError: (error) => toast.error(errorMessage(error, t("Could not post the comment"))),
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (content.trim()) mutation.mutate();
      }}
    >
      <Textarea
        aria-label={t("Comment")}
        className="min-h-20"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && content.trim()) mutation.mutate();
        }}
        placeholder={t("Write a comment…")}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-subtle-foreground text-xs">{t("⌘ + Enter to send")}</span>
        <Button type="submit" variant="secondary" disabled={mutation.isPending || !content.trim()}>
          {t("Comment")}
        </Button>
      </div>
    </form>
  );
}
