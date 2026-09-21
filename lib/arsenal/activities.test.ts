import { describe, expect, it } from "vitest";
import { getAllModules } from "@/lib/seeds/quick-draw-modules";
import { ACTIVITIES, CATEGORIES, findActivities, quickDrawHref } from "./activities";

describe("ACTIVITIES", () => {
  it("has unique ids and routes", () => {
    const ids = ACTIVITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    const routes = ACTIVITIES.map((a) => a.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("files every activity under a category that has a tab", () => {
    const keys = new Set(CATEGORIES.map((c) => c.key));
    for (const a of ACTIVITIES) expect(keys.has(a.category), a.id).toBe(true);
    for (const c of CATEGORIES) expect(findActivities("", c.key).length, c.key).toBeGreaterThan(1);
  });

  // There were eight hand-written cards for seven modules, under names the
  // Quick Draw page never used, all opening the same picker.
  it("has exactly one Quick Draw card per module, named after it and linking to it", () => {
    const cards = ACTIVITIES.filter((a) => a.id.startsWith("qd-"));
    const modules = getAllModules();
    expect(cards).toHaveLength(modules.length);
    for (const mod of modules) {
      const card = cards.find((c) => c.route === quickDrawHref(mod.id));
      expect(card, mod.id).toBeDefined();
      expect(card!.title).toBe(`Quick Draw: ${mod.title}`);
    }
  });
});

describe("findActivities", () => {
  it("shows the chosen category when nothing is typed", () => {
    const learn = findActivities("", "learn");
    expect(learn.length).toBeGreaterThan(0);
    expect(learn.every((a) => a.category === "learn")).toBe(true);
    expect(findActivities("   ", "learn")).toEqual(learn);
  });

  it("searches every category, not just the open tab", () => {
    // Story Bank lives under Tools; searching from Learn used to say "no match".
    const hits = findActivities("story", "learn");
    expect(hits.map((a) => a.id)).toContain("stories");
  });

  it("matches descriptions, topics and difficulty, case-insensitively", () => {
    expect(findActivities("STAR", "learn").map((a) => a.id)).toContain("stories"); // description
    expect(findActivities("networking", "learn").length).toBeGreaterThan(1); // topic
    const hard = ACTIVITIES.filter((a) => a.difficulty === "Hard").map((a) => a.id);
    expect(findActivities("HARD", "learn").map((a) => a.id)).toEqual(expect.arrayContaining(hard)); // difficulty
  });

  it("returns nothing for nonsense", () => {
    expect(findActivities("zzzz-not-a-thing", "practice")).toEqual([]);
  });
});
