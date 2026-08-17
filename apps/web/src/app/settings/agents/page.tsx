"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function AgentsPage() {
  const queryClient = useQueryClient();
  const orgs = useQuery({ queryKey: ["organizations"], queryFn: () => api.listOrganizations() });
  const [orgId, setOrgId] = useState<string>();
  const [name, setName] = useState("Claude Code");
  const [rawKey, setRawKey] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId && orgs.data?.[0]) setOrgId(orgs.data[0].id);
  }, [orgId, orgs.data]);

  const agents = useQuery({
    queryKey: ["agents", orgId],
    queryFn: () => api.listAgents(orgId!),
    enabled: Boolean(orgId),
  });

  const create = useMutation({
    mutationFn: async () => {
      const agent = await api.createAgent({ organizationId: orgId!, name });
      const key = await api.createAPIKey(agent.id, { name: "default" });
      return key;
    },
    onSuccess: (key) => {
      setRawKey(key.key ?? null);
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent and API key created");
    },
  });

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-muted-foreground text-sm">
            Issue API keys for coding agents. The secret is shown once.
          </p>
        </div>
        <Link href="/" className="text-sm underline">
          Back to board
        </Link>
      </div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="space-y-2">
          <Label>Organization</Label>
          <select
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          >
            {(orgs.data ?? []).map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent">Agent name</Label>
          <Input id="agent" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" disabled={!orgId || create.isPending}>
          Create agent + key
        </Button>
      </form>
      {rawKey ? (
        <p className="bg-muted rounded-md p-3 font-mono text-sm break-all">
          {rawKey}
          <span className="text-muted-foreground mt-1 block text-xs">
            Store this in TEAM_OPS_TOKEN. It will not be shown again.
          </span>
        </p>
      ) : null}
      <ul className="space-y-2 text-sm">
        {(agents.data ?? []).map((agent) => (
          <li key={agent.id} className="flex items-center justify-between border-b py-2">
            <span>{agent.name}</span>
            <span className="text-muted-foreground text-xs">
              {agent.lastSeenAt ? `seen ${new Date(agent.lastSeenAt).toLocaleString()}` : "never seen"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
