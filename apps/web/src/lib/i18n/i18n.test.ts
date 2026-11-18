import { describe, expect, it } from "vitest";

import { matchLocale, translate } from "./index";

describe("translate", () => {
  it("falls back to English and fills placeholders", () => {
    expect(translate("{n} days overdue", { n: 3 }, "en")).toBe("3 days overdue");
    expect(translate("{n} days overdue", { n: 3 }, "pt")).not.toBe("3 days overdue");
    expect(translate("No such key", undefined, "es")).toBe("No such key");
  });

  it("drops the context prefix in English", () => {
    expect(translate("count|Created", undefined, "en")).toBe("Created");
    expect(translate("count|Created", undefined, "pt")).toBe("Criadas");
  });

  it("matches Accept-Language", () => {
    expect(matchLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
    expect(matchLocale("fr-FR,es;q=0.5")).toBe("es");
    expect(matchLocale(undefined)).toBe("en");
  });
});
