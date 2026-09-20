// ═══════════════════════════════════════
// Mascot Types & Constants
// ═══════════════════════════════════════

export type PersonalityType = "drill-sergeant" | "cheerleader" | "zen-master" | "sarcastic-friend";

export type MascotTrigger =
  | "app-load"
  | "card-again"
  | "card-hard"
  | "card-good"
  | "card-easy"
  | "badge-earned"
  | "streak-3"
  | "streak-7"
  | "speed-run-complete"
  | "tier-unlocked"
  | "session-complete"
  | "idle-nudge"
  | "poke";

export type MascotExpression = "happy" | "stern" | "chill" | "smirk";

export interface MascotMessage {
  text: string;
  expression: MascotExpression;
  duration: number;
}

export interface MascotEventDetail {
  trigger: MascotTrigger;
  meta?: Record<string, unknown>;
}

export const MASCOT_EVENT_NAME = "mascot-trigger";

// Card-review triggers are throttled to this cooldown
export const CARD_REVIEW_COOLDOWN_MS = 10_000;

export const PERSONALITY_META: Record<PersonalityType, { name: string; description: string; accent: string }> = {
  "drill-sergeant": { name: "Drill Sergeant", description: "Tough love, military motivation", accent: "#ef4444" },
  "cheerleader":    { name: "Cheerleader",    description: "Enthusiastic hype energy",      accent: "#22c55e" },
  "zen-master":     { name: "Zen Master",     description: "Calm wisdom, inner peace",      accent: "#a855f7" },
  "sarcastic-friend": { name: "Sarcastic Friend", description: "Witty roasts, real support", accent: "#f59e0b" },
};

// Maps personality + trigger → expression
export const EXPRESSION_MAP: Record<PersonalityType, Record<MascotTrigger, MascotExpression>> = {
  "drill-sergeant": {
    "app-load": "stern", "card-again": "stern", "card-hard": "stern",
    "card-good": "chill", "card-easy": "chill", "badge-earned": "happy",
    "streak-3": "chill", "streak-7": "happy", "speed-run-complete": "stern",
    "tier-unlocked": "happy", "session-complete": "chill", "idle-nudge": "stern", "poke": "stern",
  },
  "cheerleader": {
    "app-load": "happy", "card-again": "chill", "card-hard": "chill",
    "card-good": "happy", "card-easy": "happy", "badge-earned": "happy",
    "streak-3": "happy", "streak-7": "happy", "speed-run-complete": "happy",
    "tier-unlocked": "happy", "session-complete": "happy", "idle-nudge": "chill", "poke": "happy",
  },
  "zen-master": {
    "app-load": "chill", "card-again": "chill", "card-hard": "chill",
    "card-good": "chill", "card-easy": "happy", "badge-earned": "happy",
    "streak-3": "chill", "streak-7": "happy", "speed-run-complete": "chill",
    "tier-unlocked": "happy", "session-complete": "chill", "idle-nudge": "chill", "poke": "chill",
  },
  "sarcastic-friend": {
    "app-load": "smirk", "card-again": "smirk", "card-hard": "smirk",
    "card-good": "chill", "card-easy": "smirk", "badge-earned": "happy",
    "streak-3": "smirk", "streak-7": "happy", "speed-run-complete": "smirk",
    "tier-unlocked": "happy", "session-complete": "smirk", "idle-nudge": "smirk", "poke": "smirk",
  },
};

// Helper to dispatch a mascot event from anywhere in the app
export function dispatchMascotEvent(trigger: MascotTrigger, meta?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MASCOT_EVENT_NAME, { detail: { trigger, meta } })
  );
}
