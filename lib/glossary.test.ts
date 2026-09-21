import { describe, expect, it } from "vitest";
import { GLOSSARY } from "./glossary";

describe("GLOSSARY", () => {
  it("defines each term once", () => {
    const terms = GLOSSARY.map((e) => e.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });

  // The themed names a newcomer runs into. If one is renamed (see
  // vocabulary.test.ts: one name per concept), its definition must follow.
  it.each(["Galaxy Map", "Sector", "Campaign", "Mission", "Knowledge Check", "Arsenal", "Battlestation"])("explains %s", (term) => {
    expect(GLOSSARY.some((e) => e.term === term)).toBe(true);
  });

  it("explains in a sentence or two, without defining a term by itself", () => {
    for (const { term, means } of GLOSSARY) {
      expect(means.length, term).toBeGreaterThan(30);
      expect(means.length, term).toBeLessThan(190);
      expect(means.toLowerCase().startsWith(term.toLowerCase()), term).toBe(false);
    }
  });
});
