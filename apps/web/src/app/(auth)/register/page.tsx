"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthCard } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRegistrationMode } from "@/hooks/use-registration-mode";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n";
import { ROLE_DISPLAY } from "@/lib/task-display";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const t = useT();
  const inviteToken = useSearchParams().get("invite") ?? "";
  const mode = useRegistrationMode();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const invite = useQuery({
    queryKey: ["invite", inviteToken],
    queryFn: () => api.peekInvite(inviteToken),
    enabled: Boolean(inviteToken),
    retry: false,
  });
  const preview = invite.data;

  useEffect(() => {
    if (preview?.email) setEmail(preview.email);
  }, [preview?.email]);

  const register = useMutation({
    mutationFn: () => api.register({ name, email, password, inviteToken: inviteToken || undefined }),
    onSuccess: () => router.replace(inviteToken ? "/" : "/onboarding"),
  });

  const locked = mode === "invite_only" && !inviteToken;
  const error = invite.isError
    ? errorMessage(invite.error, t("This invite is invalid or expired."))
    : register.isError
      ? errorMessage(register.error, t("Could not register"))
      : null;

  return (
    <AuthCard
      title={preview ? t("Join {org}", { org: preview.organizationName }) : t("Create an account")}
      description={
        preview
          ? t("You're invited as {role}.", {
              role: ROLE_DISPLAY[preview.role] ? t(ROLE_DISPLAY[preview.role].label).toLowerCase() : preview.role,
            })
          : t("Set up your Team-Ops account.")
      }
      footer={
        <>
          {t("Already have an account?")}{" "}
          <Link className="text-brand font-semibold hover:underline" href="/login">
            {t("Log in")}
          </Link>
        </>
      }
    >
      {locked ? (
        <p className="bg-muted text-muted-foreground rounded-xl border p-4 text-center text-sm">
          {t("This instance is invite-only. Ask an admin to send you a link, then come back here.")}
        </p>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            register.mutate();
          }}
        >
          <Field label={t("Name")} htmlFor="name">
            <Input
              id="name"
              autoComplete="name"
              placeholder={t("Your name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label={t("Email")} htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("you@company.com")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={Boolean(preview?.email)}
            />
          </Field>
          <Field label={t("Password")} htmlFor="password" hint={t("Must be at least 8 characters.")}>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder={t("Create a password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <FormError>{error}</FormError>
          <Button type="submit" size="md" className="w-full" disabled={register.isPending}>
            {preview ? t("Join workspace") : t("Get started")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
