"use client";

import { useQuery } from "@tanstack/react-query";
import { PlugIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { AgentsTable } from "@/components/agents/agents-table";
import { ConnectAgent } from "@/components/agents/connect-agent";
import {
  PageBody,
  PageHeader,
  SectionHeader,
} from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/ui/copy-field";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useWorkspace } from "@/providers/workspace-provider";

const noop = () => () => {};

export default function AgentsPage() {
  const { orgId, user, canWrite } = useWorkspace();
  const t = useT();
  const origin = useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => "",
  );
  const mcpUrl = `${origin}/mcp`;
  const [connectOpen, setConnectOpen] = useState(false);

  const agents = useQuery({
    queryKey: ["agents", orgId],
    queryFn: () => api.listAgents(orgId!),
    enabled: Boolean(orgId),
    refetchInterval: 15_000,
  });

  const list = agents.data ?? [];
  const mine = list.filter((a) => a.developerId === user.id);
  const others = list.filter((a) => a.developerId !== user.id);

  const connectButton = canWrite ? (
    <Button onClick={() => setConnectOpen(true)}>
      <PlugIcon />
      {t("Connect an editor")}
    </Button>
  ) : null;

  return (
    <>
      <PageHeader title={t("Agents")} actions={connectButton} />
      <PageBody>
        <section className="flex flex-col gap-3">
          <SectionHeader
            title={t("Your agents")}
            count={agents.data ? mine.length : undefined}
            description={t(
              "Editors signed in as you. Their cards are assigned to you.",
            )}
          />
          {agents.isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
            </div>
          ) : (
            <AgentsTable
              agents={mine}
              emptyMessage={
                canWrite
                  ? t(
                      "Connect Claude Code, Cursor or VS Code and it shows up here once you sign in.",
                    )
                  : t(
                      "Viewers follow the board but don't run coding agents. Ask an admin for developer access.",
                    )
              }
              emptyAction={connectButton}
            />
          )}
        </section>

        {others.length ? (
          <section className="flex flex-col gap-3">
            <SectionHeader
              title={t("Team agents")}
              count={others.length}
              description={t("Agents your teammates connected.")}
            />
            <AgentsTable agents={others} emptyMessage={null} />
          </section>
        ) : null}
      </PageBody>

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader
            icon={<PlugIcon />}
            title={t("Connect an editor")}
            description={t(
              "Add the Team-Ops MCP server and sign in with your account. No keys involved.",
            )}
          />
          <DialogBody className="gap-5 pb-2">
            <div className="flex flex-col gap-2">
              <Label>{t("MCP server URL")}</Label>
              <CopyField value={mcpUrl} />
            </div>
            <ConnectAgent url={mcpUrl} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
