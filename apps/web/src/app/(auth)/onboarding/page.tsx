"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TeamOpsError } from "@team-ops/api-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthCard } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n";
import { projectKeyFrom, slugify } from "@/lib/slug";

export default function OnboardingPage() {
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  );
}

function Onboarding() {
  const router = useRouter();
  const t = useT();
  const queryClient = useQueryClient();
  // ?new=1 comes from "New organization" in the app; otherwise this is first-run only.
  const addingAnother = useSearchParams().get("new") === "1";
  const orgs = useQuery({ queryKey: ["organizations"], queryFn: () => api.listOrganizations(), retry: false });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [projectName, setProjectName] = useState("Website");
  const [projectKey, setProjectKey] = useState("SITE");
  const [keyEdited, setKeyEdited] = useState(false);

  useEffect(() => {
    if (orgs.error instanceof TeamOpsError && orgs.error.status === 401) router.replace("/login?expired=1");
  }, [orgs.error, router]);

  useEffect(() => {
    if (!addingAnother && (orgs.data?.length ?? 0) > 0) router.replace("/");
  }, [addingAnother, orgs.data, router]);

  const create = useMutation({
    mutationFn: async () => {
      const org = await api.createOrganization({ name, slug });
      await api.createProject({ organizationId: org.id, name: projectName, key: projectKey.toUpperCase() });
      return org;
    },
    onSuccess: (org) => {
      try {
        window.localStorage.setItem("teamops.org", org.id);
      } catch {
        /* ignore */
      }
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
      router.replace("/");
    },
  });

  return (
    <AuthCard
      title={addingAnother ? t("New organization") : t("Set up your workspace")}
      description={t("Create an organization and its first project.")}
      footer={
        addingAnother ? (
          <button type="button" className="text-brand font-semibold hover:underline" onClick={() => router.back()}>
            {t("Cancel")}
          </button>
        ) : null
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Field label={t("Organization name")} htmlFor="name">
          <Input
            id="name"
            placeholder="Acme Labs"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
            required
          />
        </Field>
        <Field label={t("URL slug")} htmlFor="slug" hint={t("Lowercase letters, numbers and dashes.")}>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            required
          />
        </Field>
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <Field label={t("First project")} htmlFor="project">
            <Input
              id="project"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (!keyEdited) setProjectKey(projectKeyFrom(e.target.value));
              }}
              required
            />
          </Field>
          <Field label={t("Key")} htmlFor="key">
            <Input
              id="key"
              className="font-mono uppercase"
              value={projectKey}
              onChange={(e) => {
                setProjectKey(e.target.value);
                setKeyEdited(true);
              }}
              required
            />
          </Field>
        </div>
        <FormError>{create.isError ? errorMessage(create.error, t("Could not create workspace")) : null}</FormError>
        <Button type="submit" size="md" className="w-full" disabled={create.isPending}>
          {create.isPending ? t("Creating…") : t("Continue to board")}
        </Button>
      </form>
    </AuthCard>
  );
}
