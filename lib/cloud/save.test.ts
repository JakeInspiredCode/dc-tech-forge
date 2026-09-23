import { beforeEach, describe, expect, it, vi } from "vitest";

async function load() {
  vi.resetModules();
  const store = await import("@/lib/data/store");
  const { seedIfEmpty } = await import("@/lib/data/seed");
  const { mutations } = await import("@/lib/data/operations");
  const save = await import("./save");
  seedIfEmpty();
  return { ...store, mutations, ...save };
}

beforeEach(() => localStorage.clear());

const userCard = {
  _id: "u1", _creationTime: 1, cardId: "user-card-1", topicId: "linux", type: "definition",
  front: "My own card", back: "My answer", difficulty: 1, tier: 1, easeFactor: 2.5, interval: 0, repetitions: 0, dueDate: "2026-09-23",
};

describe("the cloud save", () => {
  it("leaves shipped card content behind on the way up and restores it exactly on the way down", async () => {
    const { getState, mutate, mutations, toCloudSave, fromCloudSave } = await load();
    const first = getState().forgeCards[0].cardId;
    await mutations["forgeReviews:add"]({ cardId: first, timestamp: "2026-09-20T10:00:00.000Z", quality: 5, responseTime: 900 });
    mutate("forgeCards", (prev) =>
      prev.map((c) => (c.cardId === first ? { ...c, repetitions: 3, interval: 7, easeFactor: 2.7, dueDate: "2026-09-30", lastReview: "2026-09-23" } : c)),
    );
    mutate("forgeCards", (prev) => [...prev, userCard]);
    const before = getState();

    const wire = JSON.parse(JSON.stringify(toCloudSave(before)));
    expect(wire.data.forgeCards[0]).not.toHaveProperty("front");
    expect(wire.data.forgeCards[0]).toMatchObject({ cardId: first, repetitions: 3, interval: 7, easeFactor: 2.7, lastReview: "2026-09-23" });
    expect(wire.data.forgeCards.at(-1)).toMatchObject({ cardId: "user-card-1", front: "My own card" });
    expect(wire.sampleData).toBe(false);
    expect(JSON.stringify(wire).length).toBeLessThan(JSON.stringify(before).length / 2);

    const back = fromCloudSave(wire);
    expect(back.ok).toBe(true);
    if (back.ok) {
      expect(back.backup.data.forgeCards).toEqual(before.forgeCards);
      expect(back.backup.data.forgeReviews).toEqual(before.forgeReviews);
      expect(back.backup.data.forgeMissionProgress).toEqual(before.forgeMissionProgress);
    }
  });

  it("drops a row for a card no longer shipped, keeps a person's own card, and rejects anything malformed", async () => {
    const { getState, toCloudSave, fromCloudSave } = await load();
    const wire = JSON.parse(JSON.stringify(toCloudSave(getState())));
    wire.data.forgeCards.push({ _id: "o1", _creationTime: 1, cardId: "gone-card", easeFactor: 2.5, interval: 0, repetitions: 0, dueDate: "2026-01-01" });
    wire.data.forgeCards.push(userCard);
    const back = fromCloudSave(wire);
    expect(back.ok).toBe(true);
    if (back.ok) {
      expect(back.backup.data.forgeCards.some((c) => c.cardId === "gone-card")).toBe(false);
      expect(back.backup.data.forgeCards.some((c) => c.cardId === "user-card-1")).toBe(true);
    }

    expect(fromCloudSave("nope").ok).toBe(false);
    expect(fromCloudSave({ data: { forgeCards: [{ cardId: 7 }] } }).ok).toBe(false);
    const bad = JSON.parse(JSON.stringify(toCloudSave(getState())));
    bad.data.forgeReviews = [{ _id: "r", _creationTime: 1, cardId: "x", timestamp: "t", quality: "high", responseTime: 1 }];
    expect(fromCloudSave(bad)).toMatchObject({ ok: false, error: expect.stringContaining("forgeReviews[0].quality") });
    const proto = JSON.parse(JSON.stringify(toCloudSave(getState())));
    proto.data.forgeCards[0].__proto__ = { polluted: true };
    const cleaned = fromCloudSave(proto);
    expect(cleaned.ok).toBe(true);
    if (cleaned.ok) expect(Object.keys(cleaned.backup.data.forgeCards[0])).not.toContain("polluted");
  });
});
