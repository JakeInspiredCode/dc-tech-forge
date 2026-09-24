// What one Fleet Log row says. Pure, and the same for a row of your own and —
// once accounts exist — a row from someone else. That is why a row carries only
// ids and numbers and this file turns them into words: nothing anyone else
// typed can end up on your screen. An id that matches nothing shipped
// describes as null and is not shown at all.

import { getBounty, getCampaign, getMission } from "@/lib/seeds/campaigns";
import { BADGE_DEFS, TOPICS } from "@/lib/types";
import type { ActivityFields, ActivityKind } from "@/lib/data/schema";

/** Titles, by id, for the kinds whose content is loaded on demand (names.ts). */
export type NameTable = Partial<Record<ActivityKind, Record<string, string>>>;

/** A run of plain words, or a named thing (a mission, a badge…) to highlight. */
export type LinePart = string | { name: string };

export interface ActivityLine {
  /** Decorative glyph from the app's set; hidden from screen readers. */
  glyph: string;
  parts: LinePart[];
  /** The sentence as plain text, minus the actor. */
  text: string;
}

/** Kinds that name nothing until their name table has loaded. */
export const LAZY_KINDS: ReadonlySet<ActivityKind> = new Set<ActivityKind>([
  "drill_completed",
  "diagnosis_solved",
  "quick_draw",
  "ticket_resolved",
]);

function line(glyph: string, ...parts: LinePart[]): ActivityLine {
  const kept = parts.filter((p) => p !== "");
  return { glyph, parts: kept, text: kept.map((p) => (typeof p === "string" ? p : p.name)).join("") };
}

const pct = (value?: number) => (value === undefined ? "" : ` — ${Math.round(value)}%`);
const article = (noun: string) => (/^[aeiou]/i.test(noun) ? "an " : "a ");

/**
 * A lazily named kind reads generically ("completed a drill") until its names
 * arrive, then by name — or not at all, if the id isn't shipped content.
 */
function named(
  names: NameTable,
  kind: ActivityKind,
  ref: string,
  withName: (name: string) => ActivityLine,
  without: () => ActivityLine,
): ActivityLine | null {
  const table = names[kind];
  if (!table) return without();
  const name = table[ref];
  return name ? withName(name) : null;
}

export function describeActivity(
  row: Pick<ActivityFields, "kind" | "ref" | "value">,
  names: NameTable = {},
): ActivityLine | null {
  const { kind, ref, value } = row;
  switch (kind) {
    case "mission_accomplished": {
      const mission = getMission(ref);
      return mission ? line("◆", "accomplished ", { name: mission.title }, pct(value)) : null;
    }
    case "campaign_completed": {
      const campaign = getCampaign(ref);
      return campaign ? line("✦", "completed the ", { name: campaign.title }, " campaign") : null;
    }
    case "badge_earned": {
      const badge = BADGE_DEFS.find((b) => b.id === ref);
      return badge ? line("⬡", "earned the ", { name: badge.name }, " badge") : null;
    }
    case "speed_run": {
      const topic = ref === "mixed" ? "Mixed topics" : TOPICS.find((t) => t.id === ref)?.name;
      return topic ? line("⚡", `scored ${Math.round(value ?? 0)} pts in a `, { name: topic }, " Speed Run") : null;
    }
    case "session_completed":
      return line("▤", "finished a study session", value ? ` — ${Math.round(value)} cards` : "");
    case "bounty_completed": {
      const bounty = getBounty(ref);
      return bounty ? line("◇", "completed the bounty ", { name: bounty.title }) : null;
    }
    case "drill_completed":
      return named(
        names, kind, ref,
        (name) => line("▲", "completed the drill ", { name }, pct(value)),
        () => line("▲", "completed a drill", pct(value)),
      );
    case "diagnosis_solved":
      return named(
        names, kind, ref,
        (name) => line("▲", "solved ", { name }, pct(value)),
        () => line("▲", "solved a diagnosis scenario", pct(value)),
      );
    case "quick_draw":
      return named(
        names, kind, ref,
        (name) => line("⚡", `scored ${Math.round(value ?? 0)}% on Quick Draw: `, { name }),
        () => line("⚡", `scored ${Math.round(value ?? 0)}% on Quick Draw`),
      );
    case "ticket_resolved":
      return named(
        names, kind, ref,
        (level) => line("▲", `resolved ${article(level)}`, { name: `${level} ticket` }, " in Battlestation", pct(value)),
        () => line("▲", "resolved a ticket in Battlestation", pct(value)),
      );
    default:
      return null;
  }
}

/** "just now", "4m ago", "3h ago", "2d ago", then a short date. */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const seconds = Math.max(0, Math.round((now - t) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
