"use client";

import type { Comment, Member } from "@team-ops/api-client";
import { BotIcon } from "lucide-react";

import { UserAvatar } from "@/components/ui/avatar";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";

import { actorName } from "./actor";

export function CommentList({ comments, members }: { comments: Comment[]; members: Map<string, Member> }) {
  const t = useT();
  if (comments.length === 0) {
    return <p className="text-subtle-foreground text-sm">{t("No comments yet.")}</p>;
  }
  return (
    <ul className="flex flex-col gap-5">
      {comments.map((comment) => {
        const name = actorName(comment.authorType, comment.authorId, members);
        const author = comment.authorId ? members.get(comment.authorId) : undefined;
        return (
          <li key={comment.id} className="flex gap-3">
            {comment.authorType === "agent" ? (
              <span className="bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-full">
                <BotIcon className="size-4" />
              </span>
            ) : (
              <UserAvatar name={name} src={author?.avatarUrl} size="sm" />
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-2 text-sm">
                <span className="text-foreground font-semibold">{name}</span>
                <time className="text-subtle-foreground text-xs" dateTime={comment.createdAt}>
                  {formatDateTime(comment.createdAt)}
                </time>
              </p>
              <p className="text-secondary-foreground mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
