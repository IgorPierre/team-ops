"use client";

import type { Activity, Member } from "@team-ops/api-client";

const LABELS: Record<string, string> = {
  "task.created": "created task",
  "task.updated": "updated task",
  "task.assigned": "assigned task",
  "task.unassigned": "unassigned task",
  "task.moved": "moved task",
  "task.started": "started task",
  "task.blocked": "blocked task",
  "task.unblocked": "unblocked task",
  "task.progress_reported": "reported progress",
  "task.review_requested": "requested review",
  "task.completed": "completed task",
  "task.reopened": "reopened task",
  "task.archived": "archived task",
  "comment.created": "commented",
};

export function ActivityTimeline({
  activities,
  members,
}: {
  activities: Activity[];
  members: Member[];
}) {
  const names = Object.fromEntries(members.map((m) => [m.userId, m.name]));
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold">Activity</h3>
      <ol className="border-border space-y-3 border-l pl-4">
        {activities.map((item) => {
          const actor =
            item.actorType === "agent"
              ? "Agent"
              : item.actorId
                ? (names[item.actorId] ?? "Someone")
                : "System";
          const from = item.oldValue && "status" in item.oldValue ? String(item.oldValue.status) : null;
          const to = item.newValue && "status" in item.newValue ? String(item.newValue.status) : null;
          return (
            <li key={item.id} className="text-sm">
              <p className="text-muted-foreground text-xs tabular-nums">
                {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p>
                <span className="font-medium">{actor}</span> {LABELS[item.action] ?? item.action}
                {from && to ? (
                  <span className="text-muted-foreground">
                    {" "}
                    {from} → {to}
                  </span>
                ) : null}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
