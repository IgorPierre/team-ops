"use client";

import { SearchIcon, UserPlusIcon } from "lucide-react";
import { useMemo, useState } from "react";

import {
  PageBody,
  PageHeader,
  SectionHeader,
} from "@/components/layout/page-header";
import { InviteDialog } from "@/components/members/invite-dialog";
import { MembersTable } from "@/components/members/members-table";
import { PendingInvites } from "@/components/members/pending-invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import { useWorkspace } from "@/providers/workspace-provider";

export default function MembersPage() {
  const { members, membersQuery, isAdmin } = useWorkspace();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const t = useT();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [members, search]);

  return (
    <>
      <PageHeader title={t("People")} />
      <PageBody>
        <section className="flex flex-col gap-4">
          <SectionHeader
            title={t("All members")}
            count={members.length}
            actions={
              <>
                <Input
                  size="sm"
                  leadingIcon={SearchIcon}
                  type="search"
                  placeholder={t("Search")}
                  aria-label={t("Search members")}
                  className="sm:w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {isAdmin ? (
                  <Button size="md" onClick={() => setInviteOpen(true)}>
                    <UserPlusIcon />
                    {t("Invite")}
                  </Button>
                ) : null}
              </>
            }
          />
          {membersQuery.isLoading ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : (
            <MembersTable members={visible} />
          )}
        </section>
        <PendingInvites />
      </PageBody>
      {isAdmin ? (
        <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      ) : null}
    </>
  );
}
