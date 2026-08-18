"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/logo-mark";
import { api } from "@/lib/api";
import { TeamOpsError } from "@team-ops/api-client";

export default function OnboardingPage() {
  const router = useRouter();
  const orgs = useQuery({ queryKey: ["organizations"], queryFn: () => api.listOrganizations() });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [projectName, setProjectName] = useState("Website");
  const [projectKey, setProjectKey] = useState("SITE");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgs.isError && orgs.error instanceof TeamOpsError && orgs.error.status === 401) {
      router.replace("/login");
    }
  }, [orgs.error, orgs.isError, router]);

  useEffect(() => {
    if (orgs.isSuccess && (orgs.data?.length ?? 0) > 0) {
      router.replace("/");
    }
  }, [orgs.data, orgs.isSuccess, router]);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
          <LogoMark className="h-5" />
          Team-Ops
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Set up your workspace</h1>
        <p className="text-muted-foreground text-sm">Create an organization and the first project.</p>
      </div>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const org = await api.createOrganization({ name, slug });
            await api.createProject({
              organizationId: org.id,
              name: projectName,
              key: projectKey.toUpperCase(),
            });
            router.replace("/");
          } catch (err) {
            setError(err instanceof TeamOpsError ? err.message : "Could not create workspace");
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Organization</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Input id="project" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Input id="key" value={projectKey} onChange={(e) => setProjectKey(e.target.value)} />
          </div>
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button className="w-full" type="submit">
          Continue to board
        </Button>
      </form>
    </main>
  );
}
