import type { ProofKind, TaskProof } from "@team-ops/api-client";
import {
  DatabaseZapIcon,
  GithubIcon,
  LightbulbIcon,
  Link2Icon,
  TriangleIcon,
  type LucideIcon,
} from "lucide-react";

/** Where finished work can be checked, in the order the dialog offers them. */
export const PROOF_KINDS: {
  value: ProofKind;
  label: string;
  hint: string;
  placeholder: string;
  icon: LucideIcon;
}[] = [
  {
    value: "github",
    label: "GitHub",
    hint: "Pull request or commit",
    placeholder: "https://github.com/org/repo/pull/42",
    icon: GithubIcon,
  },
  {
    value: "vercel",
    label: "Vercel",
    hint: "Deploy or preview",
    placeholder: "https://my-app-git-feature.vercel.app",
    icon: TriangleIcon,
  },
  {
    value: "supabase",
    label: "Supabase",
    hint: "Migration, function or table",
    placeholder: "https://supabase.com/dashboard/project/…",
    icon: DatabaseZapIcon,
  },
  {
    value: "other",
    label: "Other link",
    hint: "Doc, ticket, Figma, dashboard…",
    placeholder: "https://…",
    icon: Link2Icon,
  },
  {
    value: "none",
    label: "No source",
    hint: "Planning, research, a meeting",
    placeholder: "",
    icon: LightbulbIcon,
  },
];

export function proofKindMeta(kind: ProofKind) {
  return PROOF_KINDS.find((k) => k.value === kind) ?? PROOF_KINDS[3];
}

function parse(url: string): URL | null {
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

export function isProofUrl(url: string) {
  return parse(url) !== null;
}

/** Guess the source from a pasted link, so pasting a PR picks GitHub. */
export function detectProofKind(url: string): ProofKind | null {
  const host = parse(url)?.hostname.toLowerCase();
  if (!host) return null;
  if (host === "github.com" || host.endsWith(".github.com")) return "github";
  if (host.endsWith("vercel.app") || host.endsWith("vercel.com")) return "vercel";
  if (host.endsWith("supabase.com") || host.endsWith("supabase.co")) return "supabase";
  return "other";
}

/** Short text for a proof link: "repo#42", "repo@a1b2c3d", or the host. */
export function proofText(proof: TaskProof): string | null {
  if (!proof.url) return null;
  const u = parse(proof.url);
  if (!u) return proof.url;
  if (proof.kind === "github") {
    const [, , repo, type, ref] = u.pathname.split("/");
    if (repo && (type === "pull" || type === "issues") && ref) return `${repo}#${ref}`;
    if (repo && type === "commit" && ref) return `${repo}@${ref.slice(0, 7)}`;
    if (repo) return repo;
  }
  return u.hostname.replace(/^www\./, "");
}
