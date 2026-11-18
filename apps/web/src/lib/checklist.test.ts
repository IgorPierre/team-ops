import { describe, expect, it } from "vitest";

import { checklistProgress } from "./checklist";

describe("checklistProgress", () => {
  it("counts ticked and open items across texts", () => {
    expect(
      checklistProgress("Intro\n- [x] parse\n- [ ] render\n* [X] test", "1. [ ] docs\n2) [x] ship"),
    ).toEqual({ done: 3, total: 5 });
  });

  it("ignores plain bullets, empty boxes and missing text", () => {
    expect(checklistProgress("- item\n- [ ]\n[x] not a list", null, undefined)).toEqual({ done: 0, total: 0 });
  });
});
