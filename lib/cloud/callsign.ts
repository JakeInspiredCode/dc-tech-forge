// A callsign is the only thing a person writes that other people see, so the
// rules are strict and enforced twice: here, for instant feedback, and in
// supabase/schema.sql, which is the one that counts. A test keeps the reserved
// lists identical.

export const CALLSIGN_RE = /^[a-z0-9_]{3,20}$/;

export const RESERVED_CALLSIGNS: ReadonlyArray<string> = [
  "admin", "administrator", "root", "system", "support", "staff", "moderator", "mod",
  "official", "dctf", "dc_tech_forge", "forge", "jake", "jacob", "jakebuildsfunthings",
  "anthropic", "claude", "supabase", "vercel", "null", "undefined", "you", "me",
  "anonymous", "sample", "demo", "test", "pilot", "operator", "fleet", "fleet_log",
];

/** What someone typed, as the callsign it would become: lower-case, spaces and dashes as underscores. */
export function normalizeCallsign(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/** Why a (normalized) callsign can't be used, in plain words — or null when it can. */
export function callsignProblem(callsign: string): string | null {
  if (!CALLSIGN_RE.test(callsign)) return "3–20 characters: lower-case letters, numbers and underscores.";
  if (RESERVED_CALLSIGNS.includes(callsign)) return "That one is reserved.";
  return null;
}

/** A recovery code as typed (any case, with or without separators) → the 32 hex characters, or null. */
export function normalizeCode(raw: string): string | null {
  const hex = raw.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
  return hex.length === 32 ? hex : null;
}

/** 32 hex characters → "a1b2-c3d4-…", easier to read back and to type. */
export function formatCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}
