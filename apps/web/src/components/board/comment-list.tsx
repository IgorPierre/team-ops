"use client";

import type { Comment, Member } from "@team-ops/api-client";

export function CommentList({ comments, members }: { comments: Comment[]; members: Member[] }) {
  const names = Object.fromEntries(members.map((m) => [m.userId, m.name]));
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold">Comments</h3>
      <ul className="space-y-3">
        {comments.map((comment) => (
          <li key={comment.id} className="text-sm">
            <p className="font-medium">
              {comment.authorType === "agent"
                ? "Agent"
                : comment.authorId
                  ? (names[comment.authorId] ?? "Someone")
                  : "System"}
              <span className="text-muted-foreground ml-2 text-xs">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </p>
            <p className="whitespace-pre-wrap">{comment.content}</p>
          </li>
        ))}
        {comments.length === 0 ? (
          <li className="text-muted-foreground text-sm">No comments yet.</li>
        ) : null}
      </ul>
    </section>
  );
}
