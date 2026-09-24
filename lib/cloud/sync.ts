"use client";

// Keeps a signed-in browser and its cloud save in step, and publishes new
// Fleet Log rows. Rules:
//   - Every local change marks the save dirty and pushes ~2.5 s later. A
//     browser closed inside that window pushes on its next visit — the dirty
//     flag is in localStorage — so nothing is lost, only delayed.
//   - On load, a dirty browser pushes; a clean one pulls if the cloud has a
//     newer revision (another device wrote). Last writer wins; there is no
//     merge, and the person is told which way a sign-in went.
//   - Only rows logged after sign-in are published, and never while sample
//     progress is loaded. A row that the server rejects is dropped; a row it
//     can't be reached for waits.

import { hasUserActivity } from "@/lib/data/activity";
import { mutations } from "@/lib/data/operations";
import { flushPersistenceNow } from "@/lib/data/persistence";
import { isSampleDataLoaded } from "@/lib/data/sample-flag";
import { topUpSeedContent } from "@/lib/data/seed";
import { getState, getVersion, mutateMany, onChange } from "@/lib/data/store";
import type { ActivityFields, State } from "@/lib/data/schema";
import { TOPICS } from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { useSyncExternalStore } from "react";
import { getPilot, signOut, subscribePilot } from "./pilot";
import { CloudError, rpc } from "./postgrest";
import { fromCloudSave, toCloudSave } from "./save";

const PUSH_DEBOUNCE_MS = 2500;
const RATE_LIMIT_RETRY_MS = 1500;
export const PUBLISHED_EVENT = "dctf:fleet-log-published";
export const SAVED_EVENT = "dctf:cloud-saved";

// ── Status, for the Profile card ──

export interface SyncStatus {
  state: "idle" | "syncing" | "synced" | "offline" | "error";
  /** When the last successful push or pull finished. */
  at?: number;
  message?: string;
}

let status: SyncStatus = { state: "idle" };
const statusListeners = new Set<() => void>();
function setStatus(next: SyncStatus) {
  status = next;
  statusListeners.forEach((l) => l());
}
export function getSyncStatus(): SyncStatus {
  return status;
}
export function subscribeSyncStatus(l: () => void): () => void {
  statusListeners.add(l);
  return () => {
    statusListeners.delete(l);
  };
}
const idle: SyncStatus = { state: "idle" };
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatus, () => idle);
}

// ── Small persisted flags ──

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the cloud still gets the push; only the bookkeeping is lost.
  }
}
const readRev = () => Number(read(STORAGE_KEYS.cloudRev)) || 0;
const readDirty = () => read(STORAGE_KEYS.cloudDirty) === "1";

interface LogMark { t: number; ids: string[] }
function readMark(): LogMark {
  try {
    const parsed: unknown = JSON.parse(read(STORAGE_KEYS.cloudLogMark) ?? "null");
    if (parsed && typeof parsed === "object" && typeof (parsed as LogMark).t === "number") {
      const ids = Array.isArray((parsed as LogMark).ids) ? (parsed as LogMark).ids.filter((x) => typeof x === "string") : [];
      return { t: (parsed as LogMark).t, ids };
    }
  } catch {
    // fall through
  }
  return { t: Number.MAX_SAFE_INTEGER, ids: [] }; // no mark: nothing is publishable
}
/** From now on, new rows are public. Called at sign-in / registration. */
export function markLogStart(): void {
  const t = Date.now();
  // Rows logged in this same millisecond already exist: they stay private.
  const ids = getState().forgeActivity.filter((r) => r._creationTime === t).map((r) => r._id);
  write(STORAGE_KEYS.cloudLogMark, JSON.stringify({ t, ids }));
}

export interface OutboxRow extends Pick<ActivityFields, "kind" | "ref" | "value" | "at"> {
  id: string;
  t: number;
}
export function readOutbox(): OutboxRow[] {
  try {
    const parsed: unknown = JSON.parse(read(STORAGE_KEYS.cloudOutbox) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((r): r is OutboxRow => !!r && typeof r === "object" && typeof (r as OutboxRow).id === "string") : [];
  } catch {
    return [];
  }
}
function writeOutbox(rows: OutboxRow[]): void {
  write(STORAGE_KEYS.cloudOutbox, JSON.stringify(rows));
  outboxListeners.forEach((l) => l());
}
const outboxListeners = new Set<() => void>();
export function subscribeOutbox(l: () => void): () => void {
  outboxListeners.add(l);
  return () => {
    outboxListeners.delete(l);
  };
}

// ── Push / pull ──

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushing: Promise<void> | null = null;
let suppressChanges = false;

function canSync(): boolean {
  return typeof window !== "undefined" && !!getPilot() && !isSampleDataLoaded();
}

function schedulePush(delay = PUSH_DEBOUNCE_MS): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushNow();
  }, delay);
}

/** Send this browser's progress up now. Resolves when done or given up on. */
export async function pushNow(): Promise<void> {
  if (pushing) return pushing;
  pushing = (async () => {
    const pilot = getPilot();
    if (!pilot || isSampleDataLoaded()) return;
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
    setStatus({ state: "syncing" });
    const version = getVersion();
    try {
      const res = await rpc<{ rev: number }>("forge_save", { p_callsign: pilot.callsign, p_code: pilot.code, p_data: toCloudSave(getState()) });
      write(STORAGE_KEYS.cloudRev, String(res.rev));
      // A change made while the request was in the air is still unsaved; its
      // own scheduled push will carry it.
      if (getVersion() === version) write(STORAGE_KEYS.cloudDirty, null);
      setStatus({ state: "synced", at: Date.now() });
      window.dispatchEvent(new Event(SAVED_EVENT));
    } catch (err) {
      handleFailure(err, "push");
      if (err instanceof CloudError && err.code === "RATE_LIMITED") schedulePush(RATE_LIMIT_RETRY_MS);
    }
  })().finally(() => {
    pushing = null;
  });
  return pushing;
}

function handleFailure(err: unknown, what: string): void {
  const code = err instanceof CloudError ? err.code : "SERVER";
  if (code === "AUTH_FAILED") {
    // The code was rotated or the account deleted from another device.
    signOut();
    setStatus({ state: "error", message: "Signed out: this browser's recovery code is no longer valid." });
    return;
  }
  if (code === "OFFLINE" || code === "TIMEOUT") {
    setStatus({ state: "offline", at: status.at });
    return;
  }
  if (code === "RATE_LIMITED") return; // retried by the caller
  console.warn(`[cloud] ${what} failed:`, err);
  setStatus({ state: "error", at: status.at, message: code === "SAVE_TOO_LARGE" ? "Your progress is too large to save to the cloud." : "The cloud didn't accept that. It will be retried." });
}

// Replace local progress with a validated cloud save. The change hooks are
// muted so adopting doesn't count as a local edit and push the same bytes back.
async function adopt(backup: ReturnType<typeof fromCloudSave>, rev: number): Promise<boolean> {
  if (!backup.ok) {
    console.warn("[cloud] save rejected:", backup.error);
    setStatus({ state: "error", at: status.at, message: `The cloud save couldn't be read: ${backup.error}` });
    return false;
  }
  suppressChanges = true;
  try {
    mutateMany(() => backup.backup.data);
    flushPersistenceNow();
    topUpSeedContent();
    for (const topic of TOPICS) await mutations["forgeProgressRecompute:recompute"]({ topicId: topic.id });
    flushPersistenceNow();
  } finally {
    suppressChanges = false;
  }
  write(STORAGE_KEYS.cloudRev, String(rev));
  write(STORAGE_KEYS.cloudDirty, null);
  setStatus({ state: "synced", at: Date.now() });
  return true;
}

/** Take the cloud's save, whatever this browser has. Used by sign-in. */
export async function adoptCloudSave(): Promise<boolean> {
  const pilot = getPilot();
  if (!pilot) return false;
  setStatus({ state: "syncing" });
  try {
    const res = await rpc<{ data: unknown; rev: number }>("forge_load", { p_callsign: pilot.callsign, p_code: pilot.code });
    if (res.data === null) {
      setStatus({ state: "synced", at: Date.now() });
      return false;
    }
    return adopt(fromCloudSave(res.data), Number(res.rev) || 0);
  } catch (err) {
    handleFailure(err, "pull");
    return false;
  }
}

async function pullIfNewer(): Promise<void> {
  const pilot = getPilot();
  if (!pilot) return;
  try {
    const res = await rpc<{ data: unknown; rev: number }>("forge_load", { p_callsign: pilot.callsign, p_code: pilot.code });
    const rev = Number(res.rev) || 0;
    if (res.data === null) {
      // A fresh account: whatever is here becomes the save.
      if (hasUserActivity()) await pushNow();
      else setStatus({ state: "synced", at: Date.now() });
      return;
    }
    if (rev > readRev()) await adopt(fromCloudSave(res.data), rev);
    else setStatus({ state: "synced", at: Date.now() });
  } catch (err) {
    handleFailure(err, "pull");
  }
}

// ── Publishing Fleet Log rows ──

const queued = new Set<string>();

function enqueueNewRows(state: State): void {
  const mark = readMark();
  const outbox = readOutbox();
  let added = false;
  for (const row of state.forgeActivity) {
    const fresh = row._creationTime > mark.t || (row._creationTime === mark.t && !mark.ids.includes(row._id));
    if (!fresh || queued.has(row._id) || outbox.some((o) => o.id === row._id)) continue;
    outbox.push({ id: row._id, t: row._creationTime, kind: row.kind, ref: row.ref, value: row.value, at: row.at });
    queued.add(row._id);
    added = true;
  }
  if (added) writeOutbox(outbox);
}

// Published or dropped: move the mark past the row so a reload doesn't re-queue it.
function advanceMark(row: OutboxRow): void {
  const mark = readMark();
  const next: LogMark =
    row.t > mark.t || mark.t === Number.MAX_SAFE_INTEGER ? { t: row.t, ids: [row.id] }
    : row.t === mark.t ? { t: mark.t, ids: [...mark.ids, row.id] }
    : mark;
  write(STORAGE_KEYS.cloudLogMark, JSON.stringify(next));
}

// One pass over the outbox, oldest first. The outbox is re-read from storage
// for every row: a row enqueued while a request was in the air must not be
// overwritten by a stale copy.
async function flushOnce(): Promise<void> {
  const pilot = getPilot();
  if (!pilot || isSampleDataLoaded()) return;
  let published = false;
  for (;;) {
    const row = readOutbox().sort((a, b) => a.t - b.t)[0];
    if (!row) break;
    try {
      await rpc("forge_log", { p_callsign: pilot.callsign, p_code: pilot.code, p_kind: row.kind, p_ref: row.ref, p_value: row.value ?? null });
      published = true;
    } catch (err) {
      const code = err instanceof CloudError ? err.code : "SERVER";
      if (code === "AUTH_FAILED") {
        handleFailure(err, "publish");
        return;
      }
      if (code === "OFFLINE" || code === "TIMEOUT" || code === "RATE_LIMITED") break; // later
      console.warn("[cloud] row dropped:", row.kind, row.ref, code);
    }
    advanceMark(row);
    writeOutbox(readOutbox().filter((o) => o.id !== row.id));
  }
  if (published) window.dispatchEvent(new Event(PUBLISHED_EVENT));
}

let flushing: Promise<void> | null = null;
let flushAgain = false;
/** Publish what is waiting. A request made mid-flight runs another pass afterwards. */
export function flushOutbox(): Promise<void> {
  if (flushing) {
    flushAgain = true;
    return flushing;
  }
  flushing = (async () => {
    do {
      flushAgain = false;
      await flushOnce();
    } while (flushAgain);
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

// ── Wiring ──

function handleChange(state: State): void {
  if (suppressChanges || !canSync()) return;
  enqueueNewRows(state);
  write(STORAGE_KEYS.cloudDirty, "1");
  schedulePush();
  void flushOutbox();
}

async function startup(): Promise<void> {
  if (!canSync()) return;
  if (readDirty()) await pushNow();
  else await pullIfNewer();
  await flushOutbox();
}

let installed = false;
/** Call once the store is live; before that, hydration and seeding would look like edits. */
export function installCloudSync(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  onChange(handleChange);
  window.addEventListener("online", () => {
    if (readDirty()) void pushNow();
    void flushOutbox();
  });
  // Leaving the page: push what is pending rather than wait out the debounce.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && pushTimer) void pushNow();
  });
  subscribePilot(() => {
    if (getPilot()) void startup();
  });
  void startup();
}

/** After registering: this browser's progress becomes the account's save. */
export async function pushLocalSave(): Promise<void> {
  write(STORAGE_KEYS.cloudDirty, "1");
  await pushNow();
}
