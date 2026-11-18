"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2Icon, CheckIcon, PlugZapIcon, TriangleAlertIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AuthCard } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FormError } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n";
import { denyURL, isRegisteredRedirect } from "@/lib/oauth";

const PERMISSIONS = [
  "See the projects and tasks in the organization you choose",
  "Create, update and move cards, comment, and mark work done",
  "Act as you: cards it opens are assigned to you",
];

export default function AuthorizePage() {
  return (
    <Suspense fallback={null}>
      <Consent />
    </Suspense>
  );
}

function Consent() {
  const params = useSearchParams();
  const t = useT();
  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state");
  const challenge = params.get("code_challenge") ?? "";
  const method = params.get("code_challenge_method") ?? "";
  const resource = params.get("resource") ?? undefined;

  const me = useQuery({ queryKey: ["me"], queryFn: () => api.me(), retry: false });
  const orgs = useQuery({ queryKey: ["organizations"], queryFn: () => api.listOrganizations(), enabled: me.isSuccess });
  const client = useQuery({
    queryKey: ["oauth-client", clientId],
    queryFn: () => api.getOAuthClient(clientId),
    enabled: Boolean(clientId) && me.isSuccess,
    retry: false,
  });

  const writable = useMemo(() => (orgs.data ?? []).filter((o) => o.role !== "viewer"), [orgs.data]);
  const [orgId, setOrgId] = useState("");
  useEffect(() => {
    if (!orgId && writable[0]) setOrgId(writable[0].id);
  }, [orgId, writable]);

  const approve = useMutation({
    mutationFn: () =>
      api.approveOAuth({
        clientId,
        redirectUri,
        codeChallenge: challenge,
        codeChallengeMethod: method,
        state: state ?? undefined,
        resource,
        organizationId: orgId,
      }),
    onSuccess: ({ redirectTo }) => window.location.assign(redirectTo),
  });

  // Only redirect back to an address the client registered.
  const redirectOK = Boolean(client.data) && isRegisteredRedirect(client.data!.redirectUris, redirectUri);
  const appName = client.data?.clientName ?? t("An application");

  const requestError =
    params.get("response_type") !== "code"
      ? t("This sign-in request is not supported (response_type must be code).")
      : !clientId || !redirectUri
        ? t("This sign-in link is incomplete. Start the connection again from your editor.")
        : method !== "S256" || !challenge
          ? t("This editor didn't use PKCE (S256), which Team-Ops requires.")
          : client.isError
            ? errorMessage(client.error, t("Unknown application."))
            : client.data && !redirectOK
              ? t(
                  "This request returns to an address {app} didn't register. Start the connection again from your editor.",
                  { app: client.data.clientName },
                )
              : null;

  let body: React.ReactNode;
  if (requestError) {
    body = <EmptyState icon={TriangleAlertIcon} tone="error" title={t("Can't connect")} description={requestError} />;
  } else if (!client.data || !orgs.data) {
    body = (
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-3 h-10 w-full" />
      </div>
    );
  } else if (approve.isSuccess) {
    body = (
      <EmptyState
        icon={CheckCircle2Icon}
        title={t("Connected")}
        description={t("You can close this tab and go back to {app}.", { app: appName })}
      />
    );
  } else if (writable.length === 0) {
    body = (
      <EmptyState
        title={t("View-only account")}
        description={t("Your account can only view boards. Ask an admin for developer access to connect a coding agent.")}
      />
    );
  } else {
    body = (
      <div className="flex flex-col gap-5 p-6">
        <div>
          <p className="text-foreground mb-3 text-sm font-semibold">{t("{app} will be able to:", { app: appName })}</p>
          <ul className="flex flex-col gap-2.5">
            {PERMISSIONS.map((line) => (
              <li key={line} className="text-muted-foreground flex gap-3 text-sm">
                <span className="bg-brand/10 text-brand mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                  <CheckIcon className="size-3" strokeWidth={3} />
                </span>
                {t(line)}
              </li>
            ))}
          </ul>
        </div>
        {writable.length > 1 ? (
          <Field label={t("Organization")} htmlFor="org">
            <Select id="org" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
              {writable.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="text-muted-foreground text-sm">
            {t("Organization:")} <span className="text-foreground font-semibold">{writable[0].name}</span>
          </p>
        )}
        <FormError>{approve.isError ? errorMessage(approve.error, t("Could not approve the request.")) : null}</FormError>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            disabled={approve.isPending || !redirectOK}
            onClick={() => window.location.assign(denyURL(redirectUri, state))}
          >
            {t("Cancel")}
          </Button>
          <Button size="md" className="flex-1" onClick={() => approve.mutate()} disabled={approve.isPending || !orgId}>
            {t("Allow access")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthCard
      title={client.data ? t("Connect {app}", { app: appName }) : t("Connect a coding agent")}
      description={
        client.data && !approve.isSuccess
          ? t("{app} wants to keep your team's board up to date as it works.", { app: appName })
          : undefined
      }
      footer={
        me.data ? (
          <>
            {t("Signed in as")} <span className="text-foreground font-medium">{me.data.email}</span>.{" "}
            {t("You can disconnect it any time in Agents.")}
          </>
        ) : null
      }
    >
      <Card className="overflow-hidden">
        <div className="bg-muted flex items-center gap-3 border-b px-6 py-4">
          <span className="bg-card text-secondary-foreground flex size-10 items-center justify-center rounded-lg border shadow-xs">
            <PlugZapIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-semibold">{appName}</p>
            <p className="text-muted-foreground text-xs">{t("MCP client")} · OAuth 2.1</p>
          </div>
        </div>
        {body}
      </Card>
    </AuthCard>
  );
}
