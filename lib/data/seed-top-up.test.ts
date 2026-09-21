import { beforeEach, describe, expect, it, vi } from "vitest";

// A returning visitor's saved data was written by an OLDER build. These tests
// build that situation — delete a mission row, a campaign row, a card; edit a
// card's text — and check that the next load repairs exactly that and nothing else.

async function load() {
  vi.resetModules();
  const store = await import("./store");
  const seed = await import("./seed");
  const { mutations } = await import("./operations");
  seed.seedIfEmpty();
  return { ...store, ...seed, mutations };
}

beforeEach(() => localStorage.clear());

describe("topUpSeedContent", () => {
  it("does nothing, and writes nothing, when saved data is already current", async () => {
    const { topUpSeedContent, getState, getVersion } = await load();
    const before = getState();
    const version = getVersion();
    expect(topUpSeedContent()).toEqual({ cardsAdded: 0, cardsRefreshed: 0, missionsAdded: 0, campaignsAdded: 0, topicsTouched: [] });
    expect(getState().forgeCards).toBe(before.forgeCards); // same array: untouched
    expect(getVersion()).toBe(version); // no state change at all
  });

  // The bug: mission operations only update EXISTING rows, and rows were only
  // ever created for an empty table. A mission added after someone's first
  // visit could be played but never completed.
  it("gives a mission added since the first visit a progress row — so it can be completed", async () => {
    const { topUpSeedContent, getState, replaceState, mutations } = await load();
    const NEW = "scl-m04";
    replaceState({ forgeMissionProgress: getState().forgeMissionProgress.filter((m) => m.missionId !== NEW) });
    const status = () => getState().forgeMissionProgress.find((m) => m.missionId === NEW)?.status;

    await mutations["forgeMissions:submitKnowledgeCheck"]({ missionId: NEW, score: 1, passed: true, xpEarned: 100 });
    expect(status()).toBeUndefined(); // before the fix: passing the quiz saved nothing

    expect(topUpSeedContent().missionsAdded).toBe(1);
    expect(status()).toBe("available");
    await mutations["forgeMissions:submitKnowledgeCheck"]({ missionId: NEW, score: 1, passed: true, xpEarned: 100 });
    expect(status()).toBe("accomplished");
  });

  it("leaves existing mission progress exactly as it was", async () => {
    const { topUpSeedContent, getState, replaceState, mutations } = await load();
    await mutations["forgeMissions:submitKnowledgeCheck"]({ missionId: "linux-m01", score: 1, passed: true, xpEarned: 250 });
    const done = getState().forgeMissionProgress.find((m) => m.missionId === "linux-m01")!;
    replaceState({ forgeMissionProgress: getState().forgeMissionProgress.filter((m) => m.missionId !== "hw-m02") });
    topUpSeedContent();
    expect(getState().forgeMissionProgress.find((m) => m.missionId === "linux-m01")).toBe(done);
  });

  it("enrols the visitor in a campaign added since their first visit", async () => {
    const { topUpSeedContent, getState, replaceState } = await load();
    replaceState({ forgeCampaignProgress: getState().forgeCampaignProgress.filter((c) => c.campaignId !== "scale-core") });
    expect(topUpSeedContent().campaignsAdded).toBe(1);
    expect(getState().forgeCampaignProgress.find((c) => c.campaignId === "scale-core")?.enrolled).toBe(true);
  });

  it("adds a card that shipped since the first visit, and flags its topic for a recompute", async () => {
    const { topUpSeedContent, getState, replaceState } = await load();
    const gone = getState().forgeCards[0];
    replaceState({ forgeCards: getState().forgeCards.slice(1) });
    const result = topUpSeedContent();
    expect(result.cardsAdded).toBe(1);
    expect(result.topicsTouched).toEqual([gone.topicId]);
    expect(getState().forgeCards.some((c) => c.cardId === gone.cardId)).toBe(true);
  });

  it("refreshes corrected card text WITHOUT touching how well the card is known", async () => {
    const { topUpSeedContent, getState, replaceState } = await load();
    const [first, ...rest] = getState().forgeCards;
    const studied = { ...first, front: "an old typo", easeFactor: 1.7, interval: 12, repetitions: 5, dueDate: "2027-01-01", lastReview: "2026-09-01T00:00:00.000Z" };
    replaceState({ forgeCards: [studied, ...rest] });

    expect(topUpSeedContent().cardsRefreshed).toBe(1);
    const after = getState().forgeCards.find((c) => c.cardId === first.cardId)!;
    expect(after.front).toBe(first.front); // the shipped text is back
    expect(after).toMatchObject({ easeFactor: 1.7, interval: 12, repetitions: 5, dueDate: "2027-01-01", lastReview: "2026-09-01T00:00:00.000Z" });
    expect(after._id).toBe(first._id);
  });

  it("never touches a card the user made or imported", async () => {
    const { topUpSeedContent, getState, mutations } = await load();
    await mutations["forgeCards:addCard"]({ cardId: "custom-linux-1", topicId: "linux", type: "easy", front: "mine", back: "also mine", difficulty: 1, tier: 1 });
    const mine = getState().forgeCards.find((c) => c.cardId === "custom-linux-1");
    topUpSeedContent();
    expect(getState().forgeCards.find((c) => c.cardId === "custom-linux-1")).toBe(mine);
  });

  it("leaves a brand-new (empty) store to seedIfEmpty", async () => {
    vi.resetModules();
    const { topUpSeedContent } = await import("./seed");
    const { getState } = await import("./store");
    expect(topUpSeedContent()).toMatchObject({ cardsAdded: 0, missionsAdded: 0, campaignsAdded: 0 });
    expect(getState().forgeCards).toHaveLength(0);
  });
});
