import { afterEach, describe, expect, it } from "vitest";

import { setCurrentLocale } from "./i18n";
import { errorMessage } from "./errors";
import { formatDueRelative } from "./utils";

afterEach(() => setCurrentLocale("en"));

describe("display corrections", () => {
  it("keeps the due date distinct from completion for finished tasks", () => {
    setCurrentLocale("pt");
    expect(formatDueRelative("2026-08-17", "done")).toMatch(/^Prazo /);
    expect(formatDueRelative(null, "done")).toBeNull();
  });

  it("translates known sign-in errors and preserves unknown error details", () => {
    setCurrentLocale("pt");
    expect(errorMessage(new Error("Email or password is incorrect."))).toBe("E-mail ou senha incorretos.");
    expect(errorMessage(new Error("Unrecognized detail"))).toBe("Unrecognized detail");
  });
});
