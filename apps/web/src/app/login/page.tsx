"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { TeamOpsError, type RegistrationMode } from "@team-ops/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<RegistrationMode | null>(null);

  useEffect(() => {
    void api.authConfig().then((c) => setMode(c.registration)).catch(() => setMode("invite_only"));
  }, []);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <p className="text-sm font-medium tracking-wide uppercase">Team-Ops</p>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      </div>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          try {
            await api.login({ email, password });
            router.replace("/");
          } catch (err) {
            setError(err instanceof TeamOpsError ? err.message : "Could not sign in");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={pending}>
          Sign in
        </Button>
      </form>
      {mode === "invite_only" ? (
        <p className="text-muted-foreground text-sm">
          This instance is invite-only. Use the link from an admin to create an
          account.
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          No account?{" "}
          <Link className="underline" href="/register">
            Create one
          </Link>
        </p>
      )}
    </main>
  );
}
