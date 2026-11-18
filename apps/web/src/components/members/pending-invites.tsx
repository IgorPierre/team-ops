"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { SectionHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCard, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { intlLocale, useT } from "@/lib/i18n";
import { useWorkspace } from "@/providers/workspace-provider";

import { RoleBadge } from "./role-badge";

/** Open invites (admins only). Renders nothing when there are none. */
export function PendingInvites() {
  const queryClient = useQueryClient();
  const { orgId, isAdmin } = useWorkspace();
  const t = useT();

  const invites = useQuery({
    queryKey: ["invites", orgId],
    queryFn: () => api.listInvites(orgId!),
    enabled: Boolean(orgId) && isAdmin,
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.revokeInvite(orgId!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invites", orgId] });
      toast.success(t("Invite revoked"));
    },
    onError: (error) => toast.error(errorMessage(error, t("Could not revoke the invite"))),
  });

  const list = invites.data ?? [];
  if (!isAdmin || list.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("Pending invites")} count={list.length} />
      <TableCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-full">{t("Invite")}</TableHead>
              <TableHead>{t("Role")}</TableHead>
              <TableHead>{t("Expires")}</TableHead>
              <TableHead>
                <span className="sr-only">{t("Actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell>
                  <span className="text-foreground flex items-center gap-3 font-medium">
                    <span className="bg-accent text-subtle-foreground flex size-10 items-center justify-center rounded-full">
                      <LinkIcon className="size-4" />
                    </span>
                    {invite.email ?? t("Anyone with the link")}
                  </span>
                </TableCell>
                <TableCell>
                  <RoleBadge role={invite.role} />
                </TableCell>
                <TableCell>{new Date(invite.expiresAt).toLocaleDateString(intlLocale())}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="tertiary"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(invite.id)}
                  >
                    {t("Revoke")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
    </section>
  );
}
