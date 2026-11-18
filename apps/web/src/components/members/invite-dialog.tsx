"use client";

import type { Role } from "@team-ops/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MailIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/ui/copy-field";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n";
import { ROLE_DISPLAY } from "@/lib/task-display";
import { useWorkspace } from "@/providers/workspace-provider";

import { RoleSelect } from "./role-select";

/** Create a one-time invite link, optionally bound to an email address. */
export function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { orgId } = useWorkspace();
  const t = useT();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("developer");
  const [link, setLink] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => api.createInvite(orgId!, { email: email || undefined, role }),
    onSuccess: (invite) => {
      setLink(`${window.location.origin}/register?invite=${invite.token}`);
      void queryClient.invalidateQueries({ queryKey: ["invites", orgId] });
    },
    onError: (error) => toast.error(errorMessage(error, t("Could not create the invite"))),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setLink(null);
      setEmail("");
      setRole("developer");
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {link ? (
          <>
            <DialogHeader
              icon={<MailIcon />}
              title={t("Invite link ready")}
              description={t("Share it once. It works for a single sign-up and expires on its own.")}
            />
            <DialogBody>
              <CopyField value={link} />
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" size="md" onClick={() => setLink(null)}>
                {t("Invite another")}
              </Button>
              <DialogClose asChild>
                <Button size="md">{t("Done")}</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <form
            className="flex min-h-0 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <DialogHeader
              icon={<UserPlusIcon />}
              title={t("Invite a teammate")}
              description={t("You'll get a link to share. Agents never use invites: they sign in as the developer who runs them.")}
            />
            <DialogBody>
              <Field label={t("Email")} htmlFor="invite-email" hint={t("Optional. Binds the link to this address.")}>
                <Input
                  id="invite-email"
                  type="email"
                  leadingIcon={MailIcon}
                  placeholder={t("teammate@company.com")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label={t("Role")} htmlFor="invite-role" hint={t(ROLE_DISPLAY[role].description)}>
                <RoleSelect size="md" id="invite-role" value={role} onChange={setRole} />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary" size="md">
                  {t("Cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" size="md" disabled={create.isPending}>
                {create.isPending ? t("Creating…") : t("Create invite")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
