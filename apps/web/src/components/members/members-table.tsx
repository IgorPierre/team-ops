"use client";

import type { Member, Role } from "@team-ops/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import { UserIdentity } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCard, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { intlLocale, useT } from "@/lib/i18n";
import { ROLE_DISPLAY } from "@/lib/task-display";
import { useWorkspace } from "@/providers/workspace-provider";

import { RoleBadge } from "./role-badge";
import { RoleSelect } from "./role-select";

export function MembersTable({ members }: { members: Member[] }) {
  const queryClient = useQueryClient();
  const { orgId, user, isAdmin } = useWorkspace();
  const t = useT();

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => api.updateMember(orgId!, userId, { role }),
    onSuccess: (_, { role }) => {
      void queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      toast.success(t("Role changed to {role}", { role: t(ROLE_DISPLAY[role].label) }));
    },
    onError: (error) => toast.error(errorMessage(error, t("Could not change the role"))),
  });

  return (
    <TableCard>
      {members.length === 0 ? (
        <EmptyState title={t("No one matches your search")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-full">{t("Name")}</TableHead>
              <TableHead>{t("Role")}</TableHead>
              <TableHead>{t("Joined")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell>
                  <Link href={`/people/${member.userId}`} className="inline-flex max-w-full hover:opacity-80">
                    <UserIdentity
                      name={member.name}
                      badge={member.userId === user.id ? <Badge>{t("You")}</Badge> : null}
                      description={member.email}
                      src={member.avatarUrl}
                    />
                  </Link>
                </TableCell>
                <TableCell>
                  {isAdmin && member.userId !== user.id ? (
                    <RoleSelect
                      className="w-36"
                      aria-label={t("Role of {name}", { name: member.name })}
                      value={member.role}
                      disabled={updateRole.isPending}
                      onChange={(role) => updateRole.mutate({ userId: member.userId, role })}
                    />
                  ) : (
                    <RoleBadge role={member.role} />
                  )}
                </TableCell>
                <TableCell>{new Date(member.createdAt).toLocaleDateString(intlLocale())}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableCard>
  );
}
