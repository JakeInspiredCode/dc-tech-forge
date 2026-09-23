"use client";

// The cloud save is the backup file (lib/data/backup.ts) minus the shipped
// card content — 374 cards' fronts and backs are ~140 KB that every build
// already carries. Going up, a shipped card keeps only its study state; coming
// down, that state is laid back over the current shipped card, and then the
// whole thing passes the backup validator like any other file: a save is
// input from the network and is treated as hostile.

import { getAllSeedCards } from "@/lib/seeds";
import { BRAND } from "@/lib/brand";
import { parseBackup, type BackupFile, type ParseResult } from "@/lib/data/backup";
import { SCHEMA_VERSION } from "@/lib/storage-keys";
import type { CardFields, Doc, State } from "@/lib/data/schema";

type StudyField = "easeFactor" | "interval" | "repetitions" | "dueDate" | "lastReview";

let seedIndex: Map<string, ReturnType<typeof getAllSeedCards>[number]> | null = null;
function seeds() {
  if (!seedIndex) seedIndex = new Map(getAllSeedCards().map((c) => [c.id, c]));
  return seedIndex;
}

type StudyRow = Pick<Doc<CardFields>, "_id" | "_creationTime" | "cardId" | StudyField>;

function stripCard(card: Doc<CardFields>): Doc<CardFields> | StudyRow {
  if (!seeds().has(card.cardId)) return card; // the person's own card: content travels with it
  const row: StudyRow = { _id: card._id, _creationTime: card._creationTime, cardId: card.cardId, easeFactor: card.easeFactor, interval: card.interval, repetitions: card.repetitions, dueDate: card.dueDate };
  if (card.lastReview !== undefined) row.lastReview = card.lastReview;
  return row;
}

export function toCloudSave(state: State): BackupFile {
  return {
    app: BRAND.slug,
    kind: "progress-backup",
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    sampleData: false,
    data: { ...state, forgeCards: state.forgeCards.map(stripCard) as Doc<CardFields>[] },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Lay saved study state over the shipped card. A row for a card that is no
// longer shipped and carries no content of its own is dropped: it was an
// orphan here too.
function rehydrateCards(rows: unknown): unknown {
  if (!Array.isArray(rows)) return rows;
  const out: unknown[] = [];
  for (const row of rows) {
    if (!isRecord(row) || typeof row.cardId !== "string") {
      out.push(row); // let the validator say what is wrong with it
      continue;
    }
    const seed = seeds().get(row.cardId);
    if (seed) {
      out.push({
        _id: row._id, _creationTime: row._creationTime, cardId: seed.id,
        topicId: seed.topicId, type: seed.type, front: seed.front, back: seed.back,
        difficulty: seed.difficulty, tier: seed.tier, steps: seed.steps, sortOrder: seed.sortOrder,
        easeFactor: row.easeFactor, interval: row.interval, repetitions: row.repetitions,
        dueDate: row.dueDate, lastReview: row.lastReview,
      });
    } else if (typeof row.front === "string" && typeof row.back === "string") {
      out.push(row);
    }
  }
  return out;
}

/** A save as it came down the wire → a validated backup, or why not. */
export function fromCloudSave(raw: unknown): ParseResult {
  if (!isRecord(raw) || !isRecord(raw.data)) return { ok: false, error: "The cloud save has no data section." };
  const rehydrated = { ...raw, data: { ...raw.data, forgeCards: rehydrateCards(raw.data.forgeCards) } };
  return parseBackup(JSON.stringify(rehydrated));
}
