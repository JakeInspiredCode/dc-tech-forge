"use client";

// Who this browser is signed in as. The recovery code is the credential: it is
// kept in localStorage exactly as a session token would be, sent with every
// call, and never shown unless the person asks to see it.

import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { CALLSIGN_RE } from "./callsign";
import { rpc } from "./postgrest";

export interface Pilot {
  callsign: string;
  code: string;
  pilotId: string;
}

let cached: Pilot | null | undefined;
const listeners = new Set<() => void>();

function isPilot(value: unknown): value is Pilot {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.callsign === "string" && CALLSIGN_RE.test(v.callsign) &&
    typeof v.code === "string" && /^[0-9a-f]{32}$/.test(v.code) &&
    typeof v.pilotId === "string" && v.pilotId.length > 0
  );
}

export function getPilot(): Pilot | null {
  if (cached !== undefined) return cached;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.pilot) ?? "null");
    cached = isPilot(parsed) ? parsed : null;
  } catch {
    cached = null;
  }
  return cached;
}

function setPilot(pilot: Pilot | null): void {
  cached = pilot;
  try {
    if (pilot) window.localStorage.setItem(STORAGE_KEYS.pilot, JSON.stringify(pilot));
    else window.localStorage.removeItem(STORAGE_KEYS.pilot);
  } catch {
    // Storage blocked: signed in for this page only.
  }
  listeners.forEach((l) => l());
}

export function subscribePilot(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const noPilot = () => null;

export function usePilot(): Pilot | null {
  return useSyncExternalStore(subscribePilot, getPilot, noPilot);
}

// ── The account API ──

export async function registerCallsign(callsign: string): Promise<Pilot> {
  const res = await rpc<{ pilot_id: string; code: string }>("forge_register", { p_callsign: callsign });
  const pilot = { callsign, code: res.code, pilotId: res.pilot_id };
  setPilot(pilot);
  return pilot;
}

export interface SignInResult {
  pilot: Pilot;
  /** 0 when the account has no save yet. */
  saveRev: number;
}

export async function signIn(callsign: string, code: string): Promise<SignInResult> {
  const res = await rpc<{ pilot_id: string; save_rev: number }>("forge_sign_in", { p_callsign: callsign, p_code: code });
  const pilot = { callsign, code, pilotId: res.pilot_id };
  setPilot(pilot);
  return { pilot, saveRev: Number(res.save_rev) || 0 };
}

/** Forget the account in this browser. Progress here stays; the cloud copy stays. */
export function signOut(): void {
  setPilot(null);
  try {
    for (const key of [STORAGE_KEYS.cloudRev, STORAGE_KEYS.cloudDirty, STORAGE_KEYS.cloudOutbox, STORAGE_KEYS.cloudLogMark]) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Nothing to clean.
  }
}

export async function rotateCode(): Promise<string> {
  const pilot = getPilot();
  if (!pilot) throw new Error("not signed in");
  const res = await rpc<{ code: string }>("forge_rotate_code", { p_callsign: pilot.callsign, p_code: pilot.code });
  setPilot({ ...pilot, code: res.code });
  return res.code;
}

export async function deleteCloudAccount(): Promise<void> {
  const pilot = getPilot();
  if (!pilot) return;
  await rpc("forge_delete_account", { p_callsign: pilot.callsign, p_code: pilot.code });
  signOut();
}
