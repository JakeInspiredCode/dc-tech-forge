// Decisions the mission player makes about where you are and where you go
// next. Pure functions, kept apart from the component so they can be tested.

import type { ContentRefKind } from "@/lib/types/campaign";

export type ResumePoint =
  | { phase: "playing"; stepIndex: number }
  | { phase: "knowledge-check" };

interface SavedProgress {
  status: string;
  stepsCompleted: string[];
}

/**
 * Where a mission should open. A mission that is under way resumes at the
 * first step you haven't completed (or at the knowledge check, if you've done
 * them all). Anything else — never started, or already accomplished and being
 * replayed — starts from the top.
 */
export function resumePoint(loadout: ReadonlyArray<{ id: string }>, saved: SavedProgress | null): ResumePoint {
  if (!saved || saved.status !== "in-progress") return { phase: "playing", stepIndex: 0 };
  const done = new Set(saved.stepsCompleted);
  const next = loadout.findIndex((step) => !done.has(step.id));
  return next === -1 ? { phase: "knowledge-check" } : { phase: "playing", stepIndex: next };
}

/** The mission after this one in its campaign, or null if this was the last. */
export function nextMissionId(campaignMissionIds: readonly string[], currentId: string): string | null {
  const index = campaignMissionIds.indexOf(currentId);
  if (index === -1) return null;
  return campaignMissionIds[index + 1] ?? null;
}

/**
 * Open-ended activities have no finish line — you explore until you've seen
 * enough — so they can't report their own completion. The mission player
 * offers a "Done" button for these instead of treating their Back button as
 * proof of completion.
 */
export function isOpenEnded(kind: ContentRefKind): boolean {
  return kind === "boot-process" || kind === "explorer";
}

export function campaignHref(campaignId: string): string {
  return `/missions?campaign=${encodeURIComponent(campaignId)}`;
}
