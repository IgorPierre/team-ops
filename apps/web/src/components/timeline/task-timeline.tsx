"use client";

import { isTaskComplete } from "@team-ops/api-client";

import type { Member, Task } from "@team-ops/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { BotIcon, LockIcon, MessageSquareIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TaskDrawer } from "@/components/board/task-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timeline, type TimelineItem } from "@/components/ui/modern-timeline";
import { useMemberDirectory } from "@/hooks/use-member-directory";
import { useT } from "@/lib/i18n";
import {
  formatTimelineDate,
  timelineDate,
  timelineProgress,
  timelineStatus,
  truncate,
  type TimelineSort,
} from "@/lib/timeline";
import { PRIORITY_DISPLAY, STATUS_DISPLAY } from "@/lib/task-display";

const PAGE = 40;

/**
 * Tasks as a timeline. Clicking a card opens the same drawer the board uses,
 * so edits from here land on the board too.
 */
export function TaskTimeline({
  tasks,
  members,
  sort,
  showAssignee = true,
  emptyMessage,
}: {
  tasks: Task[];
  members: Member[];
  sort: TimelineSort;
  showAssignee?: boolean;
  emptyMessage?: string;
}) {
  const queryClient = useQueryClient();
  const t = useT();
  const directory = useMemberDirectory(members);
  const [limit, setLimit] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);
  const openTask = tasks.find((t) => t.id === openId) ?? null;

  const items: TimelineItem[] = useMemo(
    () =>
      tasks.slice(0, limit).map((task) => {
        const assignee = directory.get(task.assigneeId);
        const when = timelineDate(task, sort);
        const caption =
          isTaskComplete(task.status) ? "Done {date}" : sort === "updated" ? "Updated {date}" : task.dueDate ? "Due {date}" : "Created {date}";
        const body = isTaskComplete(task.status) && task.completionSummary ? task.completionSummary : task.description;
        const priority = PRIORITY_DISPLAY[task.priority];
        return {
          id: task.id,
          title: task.title,
          description: truncate(body) || t("No description yet."),
          category: `${task.key} · ${task.projectName}`,
          date: when,
          dateLabel: t(caption, { date: formatTimelineDate(when) }),
          status: timelineStatus(task.status),
          statusLabel: t(STATUS_DISPLAY[task.status].label),
          statusColor: STATUS_DISPLAY[task.status].color,
          progress: timelineProgress(task.status),
          image: assignee?.avatarUrl,
          avatarLabel: assignee?.name ?? t("Unassigned"),
          meta: (
            <>
              {showAssignee ? (
                assignee ? (
                  <Link
                    href={`/people/${assignee.userId}`}
                    className="text-secondary-foreground text-xs font-medium hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {assignee.name}
                  </Link>
                ) : (
                  <span className="text-subtle-foreground text-xs">{t("Unassigned")}</span>
                )
              ) : null}
              <Badge color={priority.color}>{t(priority.label)}</Badge>
              {task.blocked ? (
                <Badge color="error" title={task.blockedReason ?? undefined}>
                  <LockIcon />
                  {t("Blocked")}
                </Badge>
              ) : null}
              {task.source === "ai" ? (
                <Badge color="brand">
                  <BotIcon />
                  {t("Agent")}
                </Badge>
              ) : null}
              {task.commentCount > 0 ? (
                <span className="text-subtle-foreground inline-flex items-center gap-1 text-xs">
                  <MessageSquareIcon className="size-3.5" />
                  {task.commentCount}
                </span>
              ) : null}
            </>
          ),
        };
      }),
    [tasks, limit, directory, sort, showAssignee, t],
  );

  return (
    <>
      <Timeline items={items} emptyMessage={emptyMessage} onSelect={(item) => setOpenId(item.id ?? null)} />
      {tasks.length > limit ? (
        <div className="flex justify-center pt-6">
          <Button variant="secondary" onClick={() => setLimit((n) => n + PAGE)}>
            {t("Show more ({n} left)", { n: tasks.length - limit })}
          </Button>
        </div>
      ) : null}
      <TaskDrawer
        task={openTask}
        members={members}
        open={Boolean(openTask)}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        onUpdated={() => {
          void queryClient.invalidateQueries({ queryKey: ["tasks"] });
          void queryClient.invalidateQueries({ queryKey: ["timeline-tasks"] });
        }}
      />
    </>
  );
}
