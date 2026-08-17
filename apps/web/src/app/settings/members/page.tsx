"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { Role } from "@team-ops/api-client";

const roles: Role[] = ["admin", "developer", "viewer"];

export default function MembersPage() {
  const queryClient = useQueryClient();
  const orgs = useQuery({ queryKey: ["organizations"], queryFn: () => api.listOrganizations() });
  const [orgId, setOrgId] = useState<string>();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("developer");
  const [inviteURL, setInviteURL] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId && orgs.data?.[0]) setOrgId(orgs.data[0].id);
  }, [orgId, orgs.data]);

  const org = orgs.data?.find((item) => item.id === orgId);
  const isAdmin = org?.role === "admin";

  const members = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => api.listMembers(orgId!),
    enabled: Boolean(orgId),
  });
  const invites = useQuery({
    queryKey: ["invites", orgId],
    queryFn: () => api.listInvites(orgId!),
    enabled: Boolean(orgId) && isAdmin,
  });

  const createInvite = useMutation({
    mutationFn: () => api.createInvite(orgId!, { email: email || undefined, role }),
    onSuccess: (inv) => {
      const url = `${window.location.origin}/register?invite=${inv.token}`;
      setInviteURL(url);
      setEmail("");
      void queryClient.invalidateQueries({ queryKey: ["invites", orgId] });
      toast.success("Invite created");
    },
  });

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <p className="text-muted-foreground text-sm">
            Admins invite teammates. Developers write the board. Viewers read it.
            Agents only get in with a key you issue.
          </p>
        </div>
        <Link href="/" className="text-sm underline">
          Back to board
        </Link>
      </div>

      <div className="space-y-2">
        <Label>Organization</Label>
        <select
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={orgId}
          onChange={(e) => {
            setOrgId(e.target.value);
            setInviteURL(null);
          }}
        >
          {(orgs.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {isAdmin ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            createInvite.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email (optional)</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bind the link to one person"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              className="border-input bg-background h-9 rounded-md border px-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={createInvite.isPending}>
            Create invite
          </Button>
        </form>
      ) : null}

      {inviteURL ? (
        <div className="bg-muted rounded-md p-3 text-sm">
          <p className="mb-1 font-medium">Share this link once</p>
          <code className="break-all">{inviteURL}</code>
          <Button
            className="mt-2"
            size="sm"
            variant="outline"
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(inviteURL);
              toast.success("Copied");
            }}
          >
            Copy
          </Button>
        </div>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-medium">Members</h2>
        <ul className="divide-y rounded-md border">
          {(members.data ?? []).map((member) => (
            <li key={member.userId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div>
                <p>{member.name}</p>
                <p className="text-muted-foreground">{member.email}</p>
              </div>
              {isAdmin ? (
                <select
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                  value={member.role}
                  onChange={async (e) => {
                    await api.updateMember(orgId!, member.userId, { role: e.target.value as Role });
                    void queryClient.invalidateQueries({ queryKey: ["members", orgId] });
                  }}
                >
                  {roles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-muted-foreground">{member.role}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isAdmin && (invites.data?.length ?? 0) > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-medium">Pending invites</h2>
          <ul className="divide-y rounded-md border">
            {(invites.data ?? []).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  {inv.email ?? "Anyone with the link"} · {inv.role}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={async () => {
                    await api.revokeInvite(orgId!, inv.id);
                    void queryClient.invalidateQueries({ queryKey: ["invites", orgId] });
                  }}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
