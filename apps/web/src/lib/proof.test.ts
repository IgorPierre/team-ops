import { describe, expect, it } from "vitest";

import { detectProofKind, isProofUrl, proofText } from "./proof";

describe("proof", () => {
  it("detects the source from a link", () => {
    expect(detectProofKind("https://github.com/acme/api/pull/42")).toBe("github");
    expect(detectProofKind("https://app-git-x.vercel.app")).toBe("vercel");
    expect(detectProofKind("https://supabase.com/dashboard/project/abc")).toBe("supabase");
    expect(detectProofKind("https://linear.app/acme/issue/A-1")).toBe("other");
    expect(detectProofKind("not a link")).toBeNull();
  });

  it("accepts only http(s) links", () => {
    expect(isProofUrl("https://x.dev")).toBe(true);
    expect(isProofUrl("javascript:alert(1)")).toBe(false);
  });

  it("shortens links for the card", () => {
    expect(proofText({ kind: "github", url: "https://github.com/acme/api/pull/42" })).toBe("api#42");
    expect(proofText({ kind: "github", url: "https://github.com/acme/api/commit/a1b2c3d4e5" })).toBe("api@a1b2c3d");
    expect(proofText({ kind: "vercel", url: "https://www.app.vercel.app/x" })).toBe("app.vercel.app");
    expect(proofText({ kind: "none" })).toBeNull();
  });
});
