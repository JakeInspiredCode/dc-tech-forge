// ═══════════════════════════════════════
// Card Export / Import Utilities
// ═══════════════════════════════════════

import { TOPICS } from "@/lib/types";

export interface ExportedCard {
  cardId: string;
  topicId: string;
  type: string;
  front: string;
  back: string;
  difficulty: number;
  tier: number;
  steps?: string[];
}

export function exportCardsToJSON(cards: ExportedCard[]): string {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cardCount: cards.length,
    cards: cards.map((c) => ({
      cardId: c.cardId,
      topicId: c.topicId,
      type: c.type,
      front: c.front,
      back: c.back,
      difficulty: c.difficulty,
      tier: c.tier,
      steps: c.steps,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadJSON(json: string, filename: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// A deck file is untrusted: people share them. A card that gets past this is
// persisted and re-hydrated on every visit, so a malformed one (a numeric
// topicId, `steps` that isn't a list) used to crash the Cards page for good.
const MAX_DECK_CHARS = 1_000_000;
const MAX_DECK_CARDS = 2_000;
const MAX_ID_CHARS = 200;
const MAX_TEXT_CHARS = 10_000;
const CARD_TYPES = ["easy", "intermediate", "scenario"];

function isText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function isIntBetween(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function toCard(raw: unknown): ExportedCard | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const c = raw as Record<string, unknown>;

  if (!isText(c.cardId, MAX_ID_CHARS) || !isText(c.front, MAX_TEXT_CHARS) || !isText(c.back, MAX_TEXT_CHARS)) {
    return null;
  }
  if (typeof c.topicId !== "string" || !TOPICS.some((t) => t.id === c.topicId)) return null;

  const type = c.type ?? "easy";
  const difficulty = c.difficulty ?? 1;
  const tier = c.tier ?? 1;
  if (typeof type !== "string" || !CARD_TYPES.includes(type)) return null;
  if (!isIntBetween(difficulty, 1, 3) || !isIntBetween(tier, 1, 4)) return null;

  let steps: string[] | undefined;
  if (c.steps !== undefined && c.steps !== null) {
    if (!Array.isArray(c.steps) || !c.steps.every((s) => isText(s, MAX_TEXT_CHARS))) return null;
    steps = [...c.steps];
  }

  // Built field by field: nothing else from the file reaches the store.
  return { cardId: c.cardId, topicId: c.topicId, type, front: c.front, back: c.back, difficulty, tier, steps };
}

export function parseImportedCards(
  jsonString: string,
): { cards: ExportedCard[]; skipped: number; error: string | null } {
  const fail = (error: string) => ({ cards: [], skipped: 0, error });

  if (jsonString.length > MAX_DECK_CHARS) return fail("That file is too large to be a card deck.");

  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch {
    return fail("Failed to parse JSON file.");
  }

  const list = typeof data === "object" && data !== null ? (data as Record<string, unknown>).cards : undefined;
  if (!Array.isArray(list)) return fail("Invalid format: expected { cards: [...] }");
  if (list.length > MAX_DECK_CARDS) return fail(`A deck can hold at most ${MAX_DECK_CARDS} cards.`);

  const cards = list.map(toCard).filter((c): c is ExportedCard => c !== null);
  return { cards, skipped: list.length - cards.length, error: null };
}
