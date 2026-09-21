import { describe, expect, it } from "vitest";
import { ALL_CHAPTERS } from "@/lib/seeds/chapters";
import { ALL_SECTORS } from "@/lib/seeds/campaigns";
import { lessonGroups } from "./library";

describe("lessonGroups", () => {
  const groups = lessonGroups();
  const lessons = groups.flatMap((g) => g.lessons);

  // Before the library, the only way to reach any of these was from inside a mission.
  it("contains every chapter section that exists", () => {
    const inLibrary = new Set(lessons.map((l) => l.id));
    expect(ALL_CHAPTERS.map((s) => s.id).filter((id) => !inLibrary.has(id))).toEqual([]);
  });

  it("lists each lesson once, with a working-looking link", () => {
    const ids = lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of lessons) expect(l.href, l.id).toMatch(/^\/(lessons\/[a-z]+-s\d+|foundations\?section=\d+)$/);
  });

  it("groups by sector, in the curriculum's own order, under the sector's name", () => {
    const order = ALL_SECTORS.map((s) => s.id);
    expect(groups.map((g) => g.sectorId)).toEqual(order.filter((id) => groups.some((g) => g.sectorId === id)));
    for (const g of groups) expect(g.title).toBe(ALL_SECTORS.find((s) => s.id === g.sectorId)!.title);
    // every sector teaches something
    expect(groups).toHaveLength(ALL_SECTORS.length);
  });

  it("keeps lessons in mission order and says which mission each is from", () => {
    for (const g of groups) {
      const numbers = g.lessons.map((l) => l.missionNumber);
      expect([...numbers].sort((a, b) => a - b), g.title).toEqual(numbers);
      for (const l of g.lessons) expect(l.missionTitle.length, l.id).toBeGreaterThan(0);
    }
  });

  it("sends Linux Operations to the Linux Foundations lesson, section by section", () => {
    const linux = groups.find((g) => g.sectorId === "sector-linux")!;
    expect(linux.lessons.length).toBeGreaterThan(0);
    expect(linux.lessons.every((l) => l.href.startsWith("/foundations?section="))).toBe(true);
  });
});
