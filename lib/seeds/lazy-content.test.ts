import { describe, expect, it } from "vitest";
import { ALL_MISSIONS } from "@/lib/seeds/campaigns";
import { ALL_CHAPTERS } from "@/lib/seeds/chapters";
import { CHAPTER_PREFIXES, chapterPrefix, loadChapterSection } from "@/lib/seeds/chapters/load";
import { getMCQuestions } from "@/lib/seeds/knowledge-checks";
import { KNOWLEDGE_CHECK_MISSION_IDS, loadMCQuestions } from "@/lib/seeds/knowledge-checks/load";

// The lazy loaders are a second map of the same content. These tests make
// sure they can never disagree with the synchronous one.

describe("lazy knowledge checks", () => {
  it("covers exactly the missions the question bank covers — and every mission has one", () => {
    const banked = ALL_MISSIONS.map((m) => m.id).filter((id) => getMCQuestions(id));
    expect([...KNOWLEDGE_CHECK_MISSION_IDS].sort()).toEqual([...banked].sort());
    expect(banked).toHaveLength(ALL_MISSIONS.length);
  });

  it("loads the same questions the bank holds", async () => {
    for (const id of KNOWLEDGE_CHECK_MISSION_IDS) {
      expect(await loadMCQuestions(id), id).toBe(getMCQuestions(id)); // same array: same module
    }
  });

  it("answers null for a mission it does not know", async () => {
    expect(await loadMCQuestions("not-a-mission")).toBeNull();
  });
});

describe("lazy chapters", () => {
  it("can load every chapter section there is, from its id alone", async () => {
    for (const section of ALL_CHAPTERS) {
      expect(await loadChapterSection(section.id), section.id).toBe(section);
    }
  });

  it("has a loader for every id prefix in use, and no spare ones", () => {
    const used = [...new Set(ALL_CHAPTERS.map((s) => chapterPrefix(s.id)))].sort();
    expect([...CHAPTER_PREFIXES].sort()).toEqual(used);
  });

  it("answers null for an unknown section or prefix", async () => {
    expect(await loadChapterSection("hw-s999")).toBeNull();
    expect(await loadChapterSection("zz-s1")).toBeNull();
  });
});
