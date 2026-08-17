"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { TeamOpsError, type InvitePreview, type RegistrationMode } from "@team-ops/api-client";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const inviteToken = params.get("invite") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<RegistrationMode | null>(null);
  const [preview, setPreview] = useState<InvitePreview | null>(null);

  useEffect(() => {
    void api.authConfig().then((c) => setMode(c.registration)).catch(() => setMode("invite_only"));
  }, []);

  useEffect(() => {
    if (!inviteToken) return;
    void api
      .peekInvite(inviteToken)
      .then((p) => {
        setPreview(p);
        if (p.email) setEmail(p.email);
      })
      .catch((err) => {
        setError(err instanceof TeamOpsError ? err.message : "This invite is invalid or expired.");
      });
  }, [inviteToken]);

  const locked = mode === "invite_only" && !inviteToken;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <p className="text-sm font-medium tracking-wide uppercase">Team-Ops</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {preview ? `Join ${preview.organizationName}` : "Create an account"}
        </h1>
        {preview ? (
          <p className="text-muted-foreground mt-1 text-sm">
            You are invited as {preview.role}.
          </p>
        ) : null}
      </div>
      {locked ? (
        <p className="text-muted-foreground text-sm">
          This instance is invite-only. Ask an admin to send you a link, then
          sign in if you already have an account.
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await api.register({
                name,
                email,
                password,
                inviteToken: inviteToken || undefined,
              });
              router.replace(inviteToken ? "/" : "/onboarding");
            } catch (err) {
              setError(err instanceof TeamOpsError ? err.message : "Could not register");
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={Boolean(preview?.email)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button className="w-full" type="submit">
            {preview ? "Join workspace" : "Create account"}
          </Button>
        </form>
      )}
      <p className="text-muted-foreground text-sm">
        Already registered?{" "}
        <Link className="underline" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}
