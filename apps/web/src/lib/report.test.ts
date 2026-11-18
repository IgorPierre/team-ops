import { describe, expect, it } from "vitest";

import type { Report } from "@team-ops/api-client";

import { setCurrentLocale } from "./i18n";
import { formatCycle, peopleCSV, percent, presetRange, toCSV } from "./report";

describe("report helpers", () => {
  it("formats cycle time in hours, then days", () => {
    expect(formatCycle(null)).toBe("—");
    expect(formatCycle(3.25)).toBe("3.3\u00a0h");
    expect(formatCycle(30)).toBe("30\u00a0h");
    expect(formatCycle(72)).toBe("3.0\u00a0d");
    expect(formatCycle(24 * 15)).toBe("15\u00a0d");
  });

  it("formats cycle times using the selected language", () => {
    setCurrentLocale("pt");
    try {
      expect(formatCycle(3.25)).toBe("3,3\u00a0h");
      expect(formatCycle(72)).toBe("3,0\u00a0d");
    } finally {
      setCurrentLocale("en");
    }
  });

  it("builds inclusive preset ranges", () => {
    expect(presetRange(7, new Date(2026, 10, 13))).toEqual({ from: "2026-11-07", to: "2026-11-13" });
  });

  it("escapes CSV cells", () => {
    expect(toCSV(["a", "b"], [["x,y", 'say "hi"'], [null, 3]])).toBe('a,b\r\n"x,y","say ""hi"""\r\n,3\r\n');
  });

  it("guards percentages", () => {
    expect(percent(1, 0)).toBe("—");
    expect(percent(1, 3)).toBe("33%");
  });

  it("writes CSV headers in English by default and in the current locale", () => {
    const report = { byPerson: [] } as unknown as Report;
    expect(peopleCSV(report, [])).toMatch(/^Person,Completed,Completed by AI,/);
    setCurrentLocale("pt");
    try {
      expect(peopleCSV(report, [])).toMatch(/^Pessoa,Concluídas,Concluídas por IA,Criadas,/);
    } finally {
      setCurrentLocale("en");
    }
  });
});
