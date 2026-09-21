import { describe, expect, it } from "vitest";
import type { ForgeCard, TopicId } from "@/lib/types";
import { DRILL_PER_SESSION, LEARN_PER_SESSION, LEARN_PER_TOPIC, drillSession, learnSession, learnableCount, reviewSession } from "./sessions";

let n = 0;
const card = (topicId: TopicId, tier: 1 | 2 | 3 | 4, over: Partial<ForgeCard> = {}): ForgeCard => ({
  id: `c${++n}`, topicId, type: "easy", front: "q", back: "a", difficulty: 1, tier,
  easeFactor: 2.5, interval: 0, repetitions: 0, dueDate: "2099-01-01", lastReview: null, ...over,
});
const many = (count: number, topicId: TopicId, tier: 1 | 2 | 3 | 4) => Array.from({ length: count }, () => card(topicId, tier));

describe("learnSession", () => {
  it("takes only cards from tiers the topic has unlocked", () => {
    const cards = [card("linux", 1), card("linux", 2), card("linux", 3)];
    expect(learnSession(cards, [{ topicId: "linux", currentTier: 2 }]).map((c) => c.tier)).toEqual([1, 2]);
  });

  it("treats a topic with no progress row as tier 1", () => {
    expect(learnSession([card("fiber", 1), card("fiber", 2)], [])).toHaveLength(1);
  });

  it("caps each topic, so one topic cannot crowd out the rest", () => {
    const session = learnSession([...many(50, "linux", 1), ...many(5, "networking", 1)], []);
    expect(session.filter((c) => c.topicId === "linux")).toHaveLength(LEARN_PER_TOPIC);
    expect(session.filter((c) => c.topicId === "networking")).toHaveLength(5);
  });

  it("caps the whole session", () => {
    const topics: TopicId[] = ["linux", "hardware", "networking", "fiber", "power-cooling"];
    expect(learnSession(topics.flatMap((t) => many(20, t, 1)), [])).toHaveLength(LEARN_PER_SESSION);
  });

  // The bug this module exists for: every new card is tier-locked, the hub showed
  // a big number of "new cards", and clicking Learn did nothing at all.
  it("is empty — and says so — when every new card is still tier-locked", () => {
    const locked = many(40, "linux", 3);
    expect(learnSession(locked, [{ topicId: "linux", currentTier: 1 }])).toEqual([]);
    expect(learnableCount(locked, [{ topicId: "linux", currentTier: 1 }])).toBe(0);
  });

  it("counts everything learnable, not just one session's worth", () => {
    expect(learnableCount(many(50, "linux", 1), [])).toBe(50);
  });
});

describe("drillSession", () => {
  it("needs the topic to have reached the card's tier", () => {
    const cards = [card("linux", 3), card("linux", 4), card("hardware", 3), card("linux", 2)];
    const session = drillSession(cards, [{ topicId: "linux", currentTier: 3 }]);
    expect(session.map((c) => `${c.topicId}:${c.tier}`)).toEqual(["linux:3"]);
  });

  it("is empty until some topic reaches tier 3, and capped after", () => {
    expect(drillSession(many(30, "linux", 3), [])).toEqual([]);
    expect(drillSession(many(30, "linux", 3), [{ topicId: "linux", currentTier: 3 }])).toHaveLength(DRILL_PER_SESSION);
  });
});

describe("reviewSession", () => {
  const seen = { lastReview: "2026-01-01T00:00:00.000Z" };

  it("puts overdue cards first", () => {
    const session = reviewSession([card("linux", 1, { ...seen, id: "later", dueDate: "2099-01-01" }), card("linux", 1, { ...seen, id: "overdue", dueDate: "2000-01-01" })]);
    expect(session.map((c) => c.id)).toEqual(["overdue", "later"]);
  });

  // Every card is seeded with today as its due date, so a brand-new account
  // used to read "374 due" — and Review and Learn were the same cards.
  it("does not count a never-studied card as due", () => {
    expect(reviewSession([card("linux", 1, { dueDate: "2000-01-01" })])).toEqual([]);
  });

  it("keeps a lapsed card in review, not in learn (SM-2 resets repetitions to 0 on a lapse)", () => {
    const lapsed = card("linux", 1, { ...seen, repetitions: 0, dueDate: "2000-01-01" });
    expect(reviewSession([lapsed])).toEqual([lapsed]);
    expect(learnSession([lapsed], [])).toEqual([]);
    expect(learnableCount([lapsed], [])).toBe(0);
  });
});
