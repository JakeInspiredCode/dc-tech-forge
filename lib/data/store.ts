"use client";

import { ENTITY_KEYS, type State } from "./schema";

function emptyState(): State {
  return {
    forgeCards: [],
    forgeReviews: [],
    forgeSessions: [],
    forgeProgress: [],
    forgeProfile: [],
    forgeStories: [],
    forgeSpeedRuns: [],
    forgeDrills: [],
    forgeCampaignProgress: [],
    forgeMissionProgress: [],
    forgeBountyHistory: [],
    forgeDiagnosisHistory: [],
    forgeQuickDrawHistory: [],
    forgeTicketHistory: [],
    forgeActivity: [],
  };
}

let state: State = emptyState();
let version = 0;
let live = false;
const listeners = new Set<() => void>();
const flushHooks: Array<(state: State) => void> = [];

export function getState(): State {
  return state;
}

export function getVersion(): number {
  return version;
}

export function isLive(): boolean {
  return live;
}

// Flip the store to "live" after hydration + seeding. Before this, queries
// return `undefined` so server and client first-render snapshots match.
export function goLive(): void {
  if (live) return;
  live = true;
  version++;
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function onChange(hook: (state: State) => void): void {
  flushHooks.push(hook);
}

// Replace the entire state (used by hydration). Does not run flush hooks —
// this is a read from persistence, not a user mutation.
export function replaceState(next: Partial<State>): void {
  state = { ...state, ...next };
  version++;
  listeners.forEach((l) => l());
}

// Mutate a single entity list. `updater` returns the new array.
// Each call bumps the version and notifies listeners.
export function mutate<K extends keyof State>(
  key: K,
  updater: (prev: State[K]) => State[K],
): void {
  const next = updater(state[key]);
  if (next === state[key]) return;
  state = { ...state, [key]: next };
  version++;
  listeners.forEach((l) => l());
  flushHooks.forEach((h) => h(state));
}

// Patch multiple entities in one atomic operation. Used when a mutation touches
// several tables (e.g. recording a review also updates progress).
export function mutateMany(updater: (prev: State) => Partial<State> | void): void {
  const patch = updater(state);
  if (!patch) return;
  state = { ...state, ...patch };
  version++;
  listeners.forEach((l) => l());
  flushHooks.forEach((h) => h(state));
}

let _uidCounter = 0;
export function uid(): string {
  _uidCounter++;
  return `l_${Date.now().toString(36)}_${_uidCounter.toString(36)}`;
}

export { ENTITY_KEYS };
