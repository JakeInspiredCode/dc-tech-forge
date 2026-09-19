import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isCardDue, sm2, sortByPriority } from "./sm2";
import type { ForgeCard } from "./types";

// Noon UTC keeps "today" the same calendar date in every timezone the suite
// might run in (sm2 derives dates via toISOString, i.e. in UTC).
const NOW = new Date("2026-03-10T12:00:00.000Z");

function card(overrides: Partial<ForgeCard> = {}): ForgeCard {
  return {
    id: "c1",
    topicId: "linux",
    type: "easy",
    front: "front",
    back: "back",
    difficulty: 1,
    tier: 1,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: "2026-03-10",
    lastReview: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sm2 — interval schedule", () => {
  it("schedules the first successful review for 1 day out", () => {
    const r = sm2(card({ repetitions: 0 }), 4, 1000);
    expect(r.interval).toBe(1);
    expect(r.repetitions).toBe(1);
    expect(r.dueDate).toBe("2026-03-11");
  });

  it("schedules the second successful review for 3 days out", () => {
    const r = sm2(card({ repetitions: 1, interval: 1 }), 4, 1000);
    expect(r.interval).toBe(3);
    expect(r.repetitions).toBe(2);
    expect(r.dueDate).toBe("2026-03-13");
  });

  it("multiplies the interval by the ease factor from the third review on", () => {
    const r = sm2(card({ repetitions: 2, interval: 3, easeFactor: 2.5 }), 4, 1000);
    expect(r.interval).toBe(8); // round(3 * 2.5)
    expect(r.repetitions).toBe(3);
  });

  it.each([0, 1, 2] as const)("resets progress on a failing grade (%i)", (quality) => {
    const r = sm2(card({ repetitions: 5, interval: 40 }), quality, 1000);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
    expect(r.dueDate).toBe("2026-03-11");
  });
});

describe("sm2 — ease factor", () => {
  it("raises ease on a perfect answer, holds on good, lowers on hard", () => {
    expect(sm2(card(), 5, 1000).easeFactor).toBeCloseTo(2.6);
    expect(sm2(card(), 4, 1000).easeFactor).toBeCloseTo(2.5);
    expect(sm2(card(), 3, 1000).easeFactor).toBeCloseTo(2.36);
  });

  it("never drops below the 1.3 floor", () => {
    const r = sm2(card({ easeFactor: 1.3 }), 0, 1000);
    expect(r.easeFactor).toBe(1.3);
  });
});

describe("sm2 — latency penalty", () => {
  it("treats a slow (>15s) good/easy answer as hard", () => {
    const slow = sm2(card(), 5, 15001);
    expect(slow.easeFactor).toBeCloseTo(2.36); // graded as quality 3, not 5
    expect(slow.repetitions).toBe(1); // still counts as a pass
  });

  it("does not penalize an answer at exactly 15s", () => {
    expect(sm2(card(), 5, 15000).easeFactor).toBeCloseTo(2.6);
  });

  it("does not make a slow failing answer any worse", () => {
    const fast = sm2(card(), 2, 1000);
    const slow = sm2(card(), 2, 60000);
    expect(slow).toEqual(fast);
  });
});

describe("isCardDue", () => {
  it("is due today and when overdue, but not before its date", () => {
    expect(isCardDue(card({ dueDate: "2026-03-10" }))).toBe(true);
    expect(isCardDue(card({ dueDate: "2026-03-01" }))).toBe(true);
    expect(isCardDue(card({ dueDate: "2026-03-11" }))).toBe(false);
  });
});

describe("sortByPriority", () => {
  it("puts overdue cards first, then harder cards, then lower ease", () => {
    const cards = [
      card({ id: "easy-today", dueDate: "2026-03-10", difficulty: 1 }),
      card({ id: "hard-today", dueDate: "2026-03-10", difficulty: 3 }),
      card({ id: "overdue", dueDate: "2026-03-01", difficulty: 1 }),
      card({ id: "hard-today-shaky", dueDate: "2026-03-10", difficulty: 3, easeFactor: 1.4 }),
    ];
    expect(sortByPriority(cards).map((c) => c.id)).toEqual([
      "overdue",
      "hard-today-shaky",
      "hard-today",
      "easy-today",
    ]);
  });

  it("does not mutate its input", () => {
    const cards = [card({ id: "a", dueDate: "2026-03-10" }), card({ id: "b", dueDate: "2026-03-01" })];
    sortByPriority(cards);
    expect(cards.map((c) => c.id)).toEqual(["a", "b"]);
  });
});
