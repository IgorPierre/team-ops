"use client";

import type { Activity, Member } from "@team-ops/api-client";
import { Fragment, type ReactNode } from "react";

import { useT } from "@/lib/i18n";
import { STATUS_DISPLAY } from "@/lib/task-display";
import { formatDateTime } from "@/lib/utils";

import { actorName } from "./actor";

/** One whole sentence per activity type; `{actor}` is who did it. */
const SENTENCES: Record<string, string> = {
  "task.created": "{actor} created the task",
  "task.updated": "{actor} updated the task",
  "task.assigned": "{actor} assigned the task",
  "task.unassigned": "{actor} unassigned the task",
  "task.moved": "{actor} moved the task",
  "task.started": "{actor} started the task",
  "task.blocked": "{actor} blocked the task",
  "task.unblocked": "{actor} unblocked the task",
  "task.progress_reported": "{actor} reported progress",
  "task.review_requested": "{actor} requested review",
  "task.completed": "{actor} completed the task",
  "task.reopened": "{actor} reopened the task",
  "task.archived": "{actor} archived the task",
  "comment.created": "{actor} commented",
};

/** Same sentences when the status changed, with `{from}` and `{to}`. */
const STATUS_SENTENCES: Record<string, string> = {
  "task.created": "{actor} created the task from {from} to {to}",
  "task.updated": "{actor} updated the task from {from} to {to}",
  "task.moved": "{actor} moved the task from {from} to {to}",
  "task.started": "{actor} started the task from {from} to {to}",
  "task.review_requested": "{actor} requested review from {from} to {to}",
  "task.completed": "{actor} completed the task from {from} to {to}",
  "task.reopened": "{actor} reopened the task from {from} to {to}",
  "task.archived": "{actor} archived the task from {from} to {to}",
};

/** Fill `{name}` slots in a translated sentence with React nodes. */
function fill(template: string, nodes: Record<string, ReactNode>) {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={index}>{name && name in nodes ? nodes[name] : part}</Fragment>;
  });
}

export function ActivityTimeline({ activities, members }: { activities: Activity[]; members: Map<string, Member> }) {
  const t = useT();

  function statusLabel(value: unknown) {
    const key = String(value) as keyof typeof STATUS_DISPLAY;
    const label = STATUS_DISPLAY[key]?.label;
    return label ? t(label) : String(value);
  }

  if (activities.length === 0) {
    return <p className="text-subtle-foreground text-sm">{t("No activity yet.")}</p>;
  }
  return (
    <ol className="flex flex-col">
      {activities.map((item, index) => {
        const from = item.oldValue && "status" in item.oldValue ? statusLabel(item.oldValue.status) : null;
        const to = item.newValue && "status" in item.newValue ? statusLabel(item.newValue.status) : null;
        const last = index === activities.length - 1;
        const actor = (
          <span className="text-foreground font-semibold">{actorName(item.actorType, item.actorId, members)}</span>
        );
        const withStatus = from && to ? STATUS_SENTENCES[item.action] : undefined;
        const sentence = withStatus
          ? fill(t(withStatus), {
              actor,
              from: <span className="text-foreground font-medium">{from}</span>,
              to: <span className="text-foreground font-medium">{to}</span>,
            })
          : SENTENCES[item.action]
            ? fill(t(SENTENCES[item.action]), { actor })
            : fill(t("{actor} {action}"), { actor, action: item.action });
        return (
          <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
            {!last ? <span className="bg-border absolute top-4 bottom-0 left-[3.5px] w-px" aria-hidden="true" /> : null}
            <span className="bg-input ring-background relative mt-1.5 size-2 shrink-0 rounded-full ring-4" />
            <div className="min-w-0 text-sm">
              <p className="text-secondary-foreground">{sentence}</p>
              <time className="text-subtle-foreground text-xs" dateTime={item.createdAt}>
                {formatDateTime(item.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
