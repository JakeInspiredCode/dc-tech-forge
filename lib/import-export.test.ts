import { describe, expect, it } from "vitest";
import { exportCardsToJSON, parseImportedCards, type ExportedCard } from "./import-export";

const card = (overrides: Record<string, unknown> = {}) => ({
  cardId: "custom-001",
  topicId: "linux",
  type: "easy",
  front: "What does `df -i` show?",
  back: "Inode usage per filesystem.",
  difficulty: 1,
  tier: 1,
  ...overrides,
});

const deck = (cards: unknown[]) => JSON.stringify({ version: 1, cards });

describe("parseImportedCards", () => {
  it("round-trips an exported deck", () => {
    const cards: ExportedCard[] = [card(), card({ cardId: "custom-002", steps: ["one", "two"] })] as ExportedCard[];
    const result = parseImportedCards(exportCardsToJSON(cards));

    expect(result).toEqual({ cards, skipped: 0, error: null });
  });

  it("fills in defaults for the optional fields", () => {
    const { cards } = parseImportedCards(deck([{ cardId: "c", topicId: "linux", front: "Q", back: "A" }]));
    expect(cards).toEqual([
      { cardId: "c", topicId: "linux", type: "easy", front: "Q", back: "A", difficulty: 1, tier: 1, steps: undefined },
    ]);
  });

  // Each of these used to be accepted (the old check was truthiness only) and
  // then crashed the Cards page on every load once persisted.
  it.each([
    ["a numeric topicId", { topicId: 1 }],
    ["an unknown topic", { topicId: "cooking" }],
    ["steps that are not a list", { steps: "x" }],
    ["steps containing a non-string", { steps: [{}] }],
    ["a numeric front", { front: 42 }],
    ["a blank back", { back: "   " }],
    ["an unknown card type", { type: "boss" }],
    ["a tier out of range", { tier: 9 }],
    ["a fractional difficulty", { difficulty: 1.5 }],
    ["a difficulty given as text", { difficulty: "2" }],
    ["absurdly long text", { back: "x".repeat(10_001) }],
  ])("skips a card with %s, and keeps the good ones", (_label, bad) => {
    const result = parseImportedCards(deck([card(), card({ cardId: "bad", ...bad })]));

    expect(result.error).toBeNull();
    expect(result.cards.map((c) => c.cardId)).toEqual(["custom-001"]);
    expect(result.skipped).toBe(1);
  });

  it("skips entries that are not records at all", () => {
    const result = parseImportedCards(deck([card(), null, "x", 7, [card()]]));
    expect(result.cards).toHaveLength(1);
    expect(result.skipped).toBe(4);
  });

  it("copies only known fields", () => {
    const { cards } = parseImportedCards(deck([card({ easeFactor: 99, onload: "alert(1)" })]));
    expect(Object.keys(cards[0]).sort()).toEqual(
      ["back", "cardId", "difficulty", "front", "steps", "tier", "topicId", "type"].sort(),
    );
  });

  it.each([
    ["not JSON", "{oops", /parse JSON/],
    ["no cards list", JSON.stringify({ hello: 1 }), /expected \{ cards/],
    ["a bare value", "null", /expected \{ cards/],
    ["too many cards", deck(Array.from({ length: 2001 }, (_, i) => card({ cardId: `c${i}` }))), /at most 2000/],
    ["an oversized file", " ".repeat(1_000_001), /too large/],
  ])("rejects %s outright", (_label, text, message) => {
    const result = parseImportedCards(text);
    expect(result.cards).toEqual([]);
    expect(result.error).toMatch(message);
  });
});
