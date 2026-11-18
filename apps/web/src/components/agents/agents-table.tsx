"use client";

import type { Agent } from "@team-ops/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BotIcon, ClockIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { UserAvatar } from "@/components/ui/avatar";
import { Status } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { useMemberDirectory } from "@/hooks/use-member-directory";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n";
import { cn, formatDateTime } from "@/lib/utils";
import { useWorkspace } from "@/providers/workspace-provider";

function AgentStatus({ agent }: { agent: Agent }) {
  const t = useT();
  if (!agent.active) return <Status color="gray">{t("Disconnected")}</Status>;
  if (agent.connectedApp) return <Status color="green">{t("Signed in")}</Status>;
  return <Status color="orange">{t("Not signed in")}</Status>;
}

/** Connected coding agents as a responsive grid of cards. */
export function AgentsTable({
  agents,
  emptyMessage,
  emptyAction,
}: {
  agents: Agent[];
  emptyMessage: React.ReactNode;
  /** Button shown in the empty state (e.g. "Connect an editor"). */
  emptyAction?: React.ReactNode;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const { orgId, user, members, isAdmin } = useWorkspace();
  const directory = useMemberDirectory(members);
  const owners = members.filter((m) => m.role !== "viewer");

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; active?: boolean; developerId?: string }) => api.updateAgent(id, body),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["agents", orgId] });
      toast.success(vars.active === false ? t("Disconnected. The editor is signed out.") : t("Agent updated"));
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (agents.length === 0) {
    return (
      <EmptyState
        icon={BotIcon}
        className="bg-surface rounded-xl border border-dashed"
        title={t("No agents yet")}
        description={emptyMessage}
        action={emptyAction}
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {agents.map((agent) => {
        const canManage = isAdmin || agent.developerId === user.id;
        const owner = directory.get(agent.developerId);
        return (
          <li
            key={agent.id}
            className={cn(
              "bg-surface flex min-w-0 flex-col rounded-xl border dark:border-transparent dark:shadow-surface",
              !agent.active && "opacity-70",
            )}
          >
            <div className="flex items-start gap-3 p-4">
              <span className="bg-muted text-foreground/80 flex size-10 shrink-0 items-center justify-center rounded-lg">
                <BotIcon className="size-5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-foreground truncate text-sm font-semibold">{agent.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {agent.connectedApp && agent.connectedApp !== agent.name ? agent.connectedApp : t("Coding agent")}
                </p>
              </div>
              <AgentStatus agent={agent} />
            </div>

            <dl className="grid grid-cols-[5.5rem_1fr] items-center gap-x-3 gap-y-2.5 border-t px-4 py-3 text-sm">
              <dt className="text-muted-foreground text-xs font-medium">{t("Owner")}</dt>
              <dd className="min-w-0">
                {isAdmin ? (
                  <Select
                    size="sm"
                    aria-label={t("Owner of {name}", { name: agent.name })}
                    value={agent.developerId ?? ""}
                    disabled={update.isPending}
                    onChange={(e) =>
                      update.mutate({
                        id: agent.id,
                        developerId: e.target.value,
                      })
                    }
                  >
                    {!agent.developerId ? <option value="">{t("No owner")}</option> : null}
                    {owners.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userId === user.id ? t("{name} (you)", { name: m.name }) : m.name}
                      </option>
                    ))}
                  </Select>
                ) : owner ? (
                  <Link href={`/people/${owner.userId}`} className="flex min-w-0 items-center gap-2 hover:underline">
                    <UserAvatar name={owner.name} src={owner.avatarUrl} size="xs" />
                    <span className="truncate">{owner.userId === user.id ? t("You") : owner.name}</span>
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{t("No owner")}</span>
                )}
              </dd>
              <dt className="text-muted-foreground text-xs font-medium">{t("Last active")}</dt>
              <dd className="text-foreground/80 flex items-center gap-1.5">
                <ClockIcon className="text-muted-foreground size-3.5" aria-hidden="true" />
                {agent.lastSeenAt ? formatDateTime(agent.lastSeenAt) : t("Never")}
              </dd>
            </dl>

            {canManage && agent.active ? (
              <div className="mt-auto flex justify-end border-t px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={update.isPending}
                  onClick={() => update.mutate({ id: agent.id, active: false })}
                >
                  <LogOutIcon className="size-3.5" />
                  {t("Disconnect")}
                </Button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
