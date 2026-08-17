"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/label";
import { api } from "@/lib/api";

export function CommentForm({ taskId, onCreated }: { taskId: string; onCreated: () => void }) {
  const [content, setContent] = useState("");
  const mutation = useMutation({
    mutationFn: () => api.addComment(taskId, { content }),
    onSuccess: () => {
      setContent("");
      onCreated();
    },
  });
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (content.trim()) mutation.mutate();
      }}
    >
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment"
      />
      <Button type="submit" size="sm" disabled={mutation.isPending || !content.trim()}>
        Comment
      </Button>
    </form>
  );
}
