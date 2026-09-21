// Every browser-storage key the app uses, in one place. Keys are namespaced
// because an origin can be shared with other apps.
//
// The app used to be called L1NX and its keys were prefixed accordingly.
// migrateLegacyKeys() carries that data over so a returning user keeps their
// progress across the rename.

const NS = "dctf";

export const STORAGE_KEYS = {
  /** Prefix for the persisted data slices, e.g. `dctf:data:forgeCards`. */
  dataPrefix: `${NS}:data:`,
  schemaVersion: `${NS}:schema-version`,
  onboardingDone: `${NS}:onboarding-done`,
  /**
   * No longer read. It counted manual "reseeds" of card content; content is now
   * topped up on every load (lib/data/seed.ts). Still declared because older
   * builds wrote it and the L1NX migration below still carries it over.
   */
  reseedVersion: `${NS}:reseed-version`,
  lastCampaign: `${NS}:last-campaign`,
  lessonScale: `${NS}:lesson-scale`,
  /** "1" while the account is pre-filled with sample progress. */
  sampleData: `${NS}:sample-data`,
} as const;

export const SESSION_KEYS = {
  sessionCheckpoint: `${NS}:session-checkpoint`,
  loadout: (missionId: string) => `${NS}:loadout:${missionId}`,
} as const;

/** True for any key this app owns, in either storage area. */
export function isAppKey(key: string): boolean {
  return key.startsWith(`${NS}:`);
}

export const SCHEMA_VERSION = 1;

// ── Legacy (L1NX-era) keys ──

const LEGACY_DATA_PREFIX = "l1nx:data:";
const LEGACY_RESEED = /^l1nx-reseed-v(\d+)$/;

const LEGACY_LOCAL_RENAMES: ReadonlyArray<readonly [string, string]> = [
  ["l1nx-onboarding-done", STORAGE_KEYS.onboardingDone],
  ["l1nx-last-campaign", STORAGE_KEYS.lastCampaign],
  ["l1nx:lesson-scale", STORAGE_KEYS.lessonScale],
];

// Written by features that were removed (a mascot; a sound toggle whose engine
// was never actually played). Nothing reads them. "dctf:sound" is here because
// an earlier build migrated the sound preference before the toggle was cut.
const LEGACY_LOCAL_DEAD = ["l1nx-mascot-personality", "l1nx-mascot-muted", "l1nx-sound", `${NS}:sound`];
const LEGACY_SESSION_DEAD = ["l1nx-mascot-welcomed"];

const LEGACY_SESSION_CHECKPOINT = "l1nx-session-checkpoint";
const LEGACY_LOADOUT_PREFIX = "loadout:";

// Move one value at a time so peak usage is a single slice above normal, and
// never overwrite a new key: if both exist, the new one is the newer data.
function move(storage: Storage, from: string, to: string): void {
  const value = storage.getItem(from);
  if (value === null) return;
  if (storage.getItem(to) === null) storage.setItem(to, value);
  storage.removeItem(from);
}

function keysOf(storage: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key !== null) keys.push(key);
  }
  return keys;
}

function migrateLocal(storage: Storage): void {
  const keys = keysOf(storage);

  for (const key of keys) {
    if (key.startsWith(LEGACY_DATA_PREFIX)) {
      move(storage, key, STORAGE_KEYS.dataPrefix + key.slice(LEGACY_DATA_PREFIX.length));
    }
  }

  for (const [from, to] of LEGACY_LOCAL_RENAMES) move(storage, from, to);

  // One key per version ("l1nx-reseed-v4" = "done") becomes a single counter.
  let reseed = -1;
  for (const key of keys) {
    const match = LEGACY_RESEED.exec(key);
    if (!match) continue;
    reseed = Math.max(reseed, Number(match[1]));
    storage.removeItem(key);
  }
  if (reseed >= 0 && storage.getItem(STORAGE_KEYS.reseedVersion) === null) {
    storage.setItem(STORAGE_KEYS.reseedVersion, String(reseed));
  }

  for (const key of LEGACY_LOCAL_DEAD) storage.removeItem(key);

  if (storage.getItem(STORAGE_KEYS.schemaVersion) === null) {
    storage.setItem(STORAGE_KEYS.schemaVersion, String(SCHEMA_VERSION));
  }
}

function migrateSession(storage: Storage): void {
  move(storage, LEGACY_SESSION_CHECKPOINT, SESSION_KEYS.sessionCheckpoint);
  for (const key of keysOf(storage)) {
    if (key.startsWith(LEGACY_LOADOUT_PREFIX)) {
      move(storage, key, SESSION_KEYS.loadout(key.slice(LEGACY_LOADOUT_PREFIX.length)));
    }
  }
  for (const key of LEGACY_SESSION_DEAD) storage.removeItem(key);
}

/** Idempotent. Safe to call when storage is blocked or full. */
export function migrateLegacyKeys(): void {
  if (typeof window === "undefined") return;
  try {
    migrateLocal(window.localStorage);
    migrateSession(window.sessionStorage);
  } catch (err) {
    console.warn("[storage] legacy key migration skipped:", err);
  }
}

// Runs when this module is first evaluated in the browser. Every reader of a
// key imports this module, so the migration is guaranteed to have happened
// before the first read — component effect order can't get ahead of it.
migrateLegacyKeys();
