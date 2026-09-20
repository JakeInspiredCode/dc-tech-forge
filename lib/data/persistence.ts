"use client";

import { STORAGE_KEYS, isAppKey } from "@/lib/storage-keys";
import { ENTITY_KEYS, type State } from "./schema";
import { getState, onChange, replaceState } from "./store";

const PREFIX = STORAGE_KEYS.dataPrefix;
const FLUSH_DEBOUNCE_MS = 400;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

// Read all entity slices from localStorage and merge into store.
// Missing or corrupt slices are ignored.
export function hydrate(): boolean {
  if (!isBrowser()) return false;
  const patch: Partial<State> = {};
  let any = false;
  for (const key of ENTITY_KEYS) {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        patch[key] = parsed;
        any = true;
      }
    } catch {
      window.localStorage.removeItem(PREFIX + key);
    }
  }
  if (any) replaceState(patch);
  return any;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: State | null = null;
// Set by resetPersistedData(). Once the user has asked for their data to be
// erased, nothing in this page's lifetime may write it back.
let suspended = false;

function flushNow() {
  // Clear the handle so the unload handler can tell "a flush is pending" from
  // "a flush happened at some point this session".
  flushTimer = null;
  if (suspended || !isBrowser() || !pendingState) return;
  const snap = pendingState;
  pendingState = null;
  for (const key of ENTITY_KEYS) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(snap[key]));
    } catch (err) {
      console.warn(`[data] flush failed for ${key}:`, err);
    }
  }
}

function queueFlush(next: State) {
  if (suspended || !isBrowser()) return;
  pendingState = next;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushNow, FLUSH_DEBOUNCE_MS);
}

let installed = false;
export function installPersistence(): void {
  if (installed || !isBrowser()) return;
  installed = true;
  hydrate();
  onChange(queueFlush);
  // Flush on unload so recent edits survive a hard refresh.
  window.addEventListener("beforeunload", () => {
    if (suspended || !flushTimer) return;
    clearTimeout(flushTimer);
    pendingState = getState();
    flushNow();
  });
}

// Erase everything this app has stored in the browser: progress, preferences,
// the onboarding flag, in-flight session state. Callers reload afterwards.
export function resetPersistedData(): void {
  if (!isBrowser()) return;
  suspended = true;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  pendingState = null;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    // Collect first: removing while iterating shifts the indices.
    const doomed: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null && isAppKey(key)) doomed.push(key);
    }
    doomed.forEach((key) => storage.removeItem(key));
  }
}
