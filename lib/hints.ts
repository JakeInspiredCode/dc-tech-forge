import { STORAGE_KEYS } from "@/lib/storage-keys";

// One-line orientation, shown the first time someone lands on a hub other than
// the home map (which has the tour). Each is dismissed once, for good.
//
// Written for someone who has never seen the app: say what the screen IS and
// the one thing that isn't obvious about it.

export const HINTS = {
  campaign:
    "This is one campaign — a run of short missions. They are in order, but nothing is locked: open any of them. Pick a different sector from the Galaxy Map.",
  arsenal:
    "Arsenal is practice on demand: lessons, drills and tools, outside of any mission. Search looks across every tab.",
  battlestation:
    "A live ticket simulator. Pick a category on the radar, then a ticket — you resolve it by typing real commands.",
  mission:
    "A mission is a few steps, then a short knowledge check. You can skip any step, and leave whenever you like — your place is saved.",
} as const;

export type HintId = keyof typeof HINTS;

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.hintsSeen);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isHintSeen(id: HintId): boolean {
  return read().includes(id);
}

export function markHintSeen(id: HintId): void {
  try {
    const seen = new Set(read());
    seen.add(id);
    window.localStorage.setItem(STORAGE_KEYS.hintsSeen, JSON.stringify([...seen]));
  } catch {
    // Storage blocked: the hint comes back next visit, which is harmless.
  }
}
