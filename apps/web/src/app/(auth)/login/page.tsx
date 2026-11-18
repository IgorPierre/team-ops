"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthCard } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRegistrationMode } from "@/hooks/use-registration-mode";
import { api } from "@/lib/api";
import { errorMessage, safeNextPath } from "@/lib/errors";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const t = useT();
  const params = useSearchParams();
  const mode = useRegistrationMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: () => api.login({ email, password }),
    onSuccess: () => router.replace(safeNextPath(params.get("next"))),
  });

  return (
    <AuthCard
      title={t("Log in to your account")}
      description={t("Welcome back. Enter your details to continue.")}
      footer={
        mode === "invite_only" ? (
          t("This instance is invite-only. Use the link an admin sent you to create an account.")
        ) : (
          <>
            {t("Don't have an account?")}{" "}
            <Link className="text-brand font-semibold hover:underline" href="/register">
              {t("Sign up")}
            </Link>
          </>
        )
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate();
        }}
      >
        <Field label={t("Email")} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("you@company.com")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label={t("Password")} htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <FormError>{login.isError ? errorMessage(login.error, t("Could not sign in")) : null}</FormError>
        <Button type="submit" size="md" className="w-full" disabled={login.isPending}>
          {login.isPending ? t("Signing in…") : t("Sign in")}
        </Button>
      </form>
    </AuthCard>
  );
}
