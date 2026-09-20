"use client";

// Whole-account backup: export everything this browser knows to a JSON file,
// and restore it elsewhere. Browser storage is per-origin, so this is the only
// way to carry progress to another device, browser, or domain.
//
// An imported file is untrusted input. A bad record that reaches the store is
// persisted and re-hydrated on every visit, so one malformed row can crash a
// page permanently. parseBackup() therefore rebuilds every row from a
// whitelist of known fields and rejects the whole file on the first problem —
// nothing reaches the store unless all of it is valid.

import { BRAND } from "@/lib/brand";
import { SCHEMA_VERSION } from "@/lib/storage-keys";
import { flushPersistenceNow } from "./persistence";
import { isSampleDataLoaded, setSampleDataFlag } from "./sample-flag";
import { ENTITY_KEYS, type State } from "./schema";
import { getState, mutateMany } from "./store";

const KIND = "progress-backup";
const MAX_FILE_CHARS = 5_000_000;
const MAX_ROWS_PER_SLICE = 20_000;
const MAX_STRING_CHARS = 20_000;

export interface BackupFile {
  app: string;
  kind: typeof KIND;
  version: number;
  exportedAt: string;
  sampleData: boolean;
  data: State;
}

export type ParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string };

// ── Field specs ──

type FieldSpec =
  | "string" | "string?"
  | "number" | "number?"
  | "boolean"
  | "string[]" | "string[]?"
  | "object[]" | "object[]?"
  | "tiers";

type Fields<K extends keyof State> = Omit<State[K][number], "_id" | "_creationTime">;

// Mapped over the schema, so adding or renaming a field in schema.ts is a
// compile error here until the validator knows about it.
type Spec = { [K in keyof State]: { [F in keyof Required<Fields<K>>]: FieldSpec } };

const SPEC: Spec = {
  forgeCards: {
    cardId: "string", topicId: "string", type: "string", front: "string", back: "string",
    difficulty: "number", tier: "number", steps: "string[]?", sortOrder: "number?",
    easeFactor: "number", interval: "number", repetitions: "number",
    dueDate: "string", lastReview: "string?",
  },
  forgeReviews: { cardId: "string", timestamp: "string", quality: "number", responseTime: "number" },
  forgeSessions: {
    type: "string", startTime: "string", endTime: "string?", cardIds: "string[]",
    answers: "object[]", overallScore: "number?",
  },
  forgeProgress: {
    topicId: "string", masteryPercent: "number", currentTier: "number", tierProgress: "tiers",
    totalCards: "number", masteredCards: "number", learningCards: "number", newCards: "number",
    weakFlag: "boolean", lastUpdated: "string",
  },
  forgeProfile: {
    profileId: "string", streak: "number", lastSessionDate: "string", totalPoints: "number",
    badges: "string[]", totalSessionMinutes: "number",
  },
  forgeStories: {
    storyId: "string", question: "string", framework: "string", answer: "string", chunks: "object[]?",
  },
  forgeSpeedRuns: {
    timestamp: "string", topicId: "string", cardTypeFilter: "string[]", startingTime: "number",
    totalCards: "number", correctCards: "number", partialCards: "number", wrongCards: "number",
    totalPoints: "number", bestStreak: "number", avgResponseMs: "number", cardResults: "object[]",
  },
  forgeDrills: {
    scenarioId: "string", timestamp: "string", totalSteps: "number", completedSteps: "number",
    steps: "object[]", overallTermHitRate: "number",
  },
  forgeCampaignProgress: {
    campaignId: "string", enrolled: "boolean", enrolledAt: "string", currentMissionIndex: "number",
    completedMissions: "string[]", lastActivityAt: "string",
  },
  forgeMissionProgress: {
    missionId: "string", status: "string", customLoadout: "object[]?", stepsCompleted: "string[]",
    knowledgeCheckPassed: "boolean", knowledgeCheckScore: "number?", bestScore: "number?",
    accomplishedAt: "string?", lastReviewedAt: "string?", xpEarned: "number",
  },
  forgeBountyHistory: { bountyId: "string", completedAt: "string", score: "number", xpEarned: "number" },
  forgeDiagnosisHistory: {
    scenarioId: "string", completedAt: "string", difficulty: "string", score: "number",
    stepsCompleted: "number", totalSteps: "number", xpEarned: "number",
  },
  forgeQuickDrawHistory: {
    moduleId: "string", completedAt: "string", score: "number", totalItems: "number",
    correctItems: "number", timeMs: "number", xpEarned: "number",
  },
  forgeTicketHistory: {
    ticketId: "string", completedAt: "string", difficulty: "string", score: "number",
    commandsUsed: "string[]", answer: "string", usedHint: "boolean", xpEarned: "number", timeMs: "number",
  },
};

// Values the UI indexes or compares with, where an out-of-range number would
// misbehave rather than merely look odd.
const RANGES: { [K in keyof State]?: Record<string, readonly [number, number]> } = {
  forgeCards: { tier: [1, 4], difficulty: [1, 3] },
  forgeReviews: { quality: [0, 5] },
  forgeProgress: { currentTier: [1, 4], masteryPercent: [0, 100] },
};

// ── Validation ──

class Invalid extends Error {}

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_STRING_CHARS;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// Deep copy of nested JSON that drops keys able to reach a prototype.
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (!DANGEROUS_KEYS.has(k)) out[k] = sanitize(v);
    }
    return out;
  }
  if (typeof value === "string" && value.length > MAX_STRING_CHARS) {
    throw new Invalid("a text field is too long");
  }
  return value;
}

function checkField(spec: FieldSpec, value: unknown): unknown {
  const optional = spec.endsWith("?");
  if (value === undefined || value === null) {
    if (optional) return undefined;
    throw new Invalid("is missing");
  }
  switch (optional ? spec.slice(0, -1) : spec) {
    case "string":
      if (!isString(value)) throw new Invalid("must be text");
      return value;
    case "number":
      if (!isNumber(value)) throw new Invalid("must be a number");
      return value;
    case "boolean":
      if (typeof value !== "boolean") throw new Invalid("must be true or false");
      return value;
    case "string[]":
      if (!Array.isArray(value) || !value.every(isString)) throw new Invalid("must be a list of text");
      return [...value];
    case "object[]":
      if (!Array.isArray(value) || !value.every(isPlainObject)) throw new Invalid("must be a list of records");
      return sanitize(value);
    case "tiers": {
      if (!isPlainObject(value)) throw new Invalid("must be a record");
      const out: Record<string, { total: number; qualified: number }> = {};
      for (const tier of ["tier1", "tier2", "tier3", "tier4"]) {
        const t = value[tier];
        if (!isPlainObject(t) || !isNumber(t.total) || !isNumber(t.qualified)) {
          throw new Invalid(`is missing ${tier} counts`);
        }
        out[tier] = { total: t.total, qualified: t.qualified };
      }
      return out;
    }
  }
  throw new Invalid("has an unknown type");
}

function checkRow<K extends keyof State>(slice: K, row: unknown, index: number): State[K][number] {
  const where = `${slice}[${index}]`;
  if (!isPlainObject(row)) throw new Invalid(`${where} is not a record`);
  if (!isString(row._id) || row._id.length === 0) throw new Invalid(`${where}._id must be text`);
  if (!isNumber(row._creationTime)) throw new Invalid(`${where}._creationTime must be a number`);

  const clean: Record<string, unknown> = { _id: row._id, _creationTime: row._creationTime };
  for (const [field, spec] of Object.entries(SPEC[slice]) as Array<[string, FieldSpec]>) {
    let value: unknown;
    try {
      value = checkField(spec, row[field]);
    } catch (err) {
      if (err instanceof Invalid) throw new Invalid(`${where}.${field} ${err.message}`);
      throw err;
    }
    if (value === undefined) continue;
    const range = RANGES[slice]?.[field];
    if (range && ((value as number) < range[0] || (value as number) > range[1])) {
      throw new Invalid(`${where}.${field} must be between ${range[0]} and ${range[1]}`);
    }
    clean[field] = value;
  }
  // Every field was just checked against SPEC, which is typed from the schema.
  return clean as unknown as State[K][number];
}

function checkSlice<K extends keyof State>(slice: K, rows: unknown): State[K] {
  if (!Array.isArray(rows)) throw new Invalid(`${slice} must be a list`);
  if (rows.length > MAX_ROWS_PER_SLICE) throw new Invalid(`${slice} has too many rows`);
  return rows.map((row, i) => checkRow(slice, row, i)) as State[K];
}

/** Validate the text of a backup file. Never throws and never touches the store. */
export function parseBackup(text: string): ParseResult {
  if (text.length > MAX_FILE_CHARS) return { ok: false, error: "That file is too large to be a backup." };

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (!isPlainObject(raw) || raw.app !== BRAND.slug || raw.kind !== KIND) {
    return { ok: false, error: `That file isn't a ${BRAND.name} progress backup.` };
  }
  if (!isNumber(raw.version) || raw.version < 1) {
    return { ok: false, error: "That backup has no version number." };
  }
  if (raw.version > SCHEMA_VERSION) {
    return { ok: false, error: `That backup is from a newer version of ${BRAND.name}.` };
  }
  if (!isPlainObject(raw.data)) return { ok: false, error: "That backup has no data section." };

  const unknown = Object.keys(raw.data).find((k) => !(ENTITY_KEYS as string[]).includes(k));
  if (unknown !== undefined) return { ok: false, error: `That backup has an unrecognized section: ${unknown}.` };

  try {
    const data = {} as State;
    const assign = <K extends keyof State>(key: K, rows: unknown) => {
      data[key] = checkSlice(key, rows ?? []);
    };
    for (const key of ENTITY_KEYS) assign(key, (raw.data as Record<string, unknown>)[key]);

    return {
      ok: true,
      backup: {
        app: BRAND.slug,
        kind: KIND,
        version: raw.version,
        exportedAt: isString(raw.exportedAt) ? raw.exportedAt : "",
        sampleData: raw.sampleData === true,
        data,
      },
    };
  } catch (err) {
    if (err instanceof Invalid) return { ok: false, error: `That backup is damaged: ${err.message}.` };
    throw err;
  }
}

// ── Export / restore ──

export function buildBackup(): BackupFile {
  return {
    app: BRAND.slug,
    kind: KIND,
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    sampleData: isSampleDataLoaded(),
    data: getState(),
  };
}

export function backupFilename(now = new Date()): string {
  return `${BRAND.slug}-backup-${now.toISOString().split("T")[0]}.json`;
}

/**
 * Replace everything in this browser with a validated backup and persist it
 * immediately. Callers should reload afterwards so every screen re-reads.
 */
export function restoreBackup(backup: BackupFile): void {
  mutateMany(() => backup.data);
  flushPersistenceNow();
  setSampleDataFlag(backup.sampleData);
}
