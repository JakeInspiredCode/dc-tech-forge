"use client";

// Kept apart from sample-data.ts so callers that only need this question —
// the welcome screen deciding whether to offer sample progress — don't pull
// the sample generator and its content imports into their bundle.

import type { State } from "./schema";
import { getState } from "./store";

/** Has this browser's account been used for anything real? */
export function hasUserActivity(state: State = getState()): boolean {
  return (
    state.forgeReviews.length > 0 ||
    state.forgeSessions.length > 0 ||
    state.forgeStories.length > 0 ||
    state.forgeSpeedRuns.length > 0 ||
    state.forgeDrills.length > 0 ||
    state.forgeBountyHistory.length > 0 ||
    state.forgeDiagnosisHistory.length > 0 ||
    state.forgeQuickDrawHistory.length > 0 ||
    state.forgeTicketHistory.length > 0 ||
    state.forgeProfile.some((p) => p.totalPoints > 0) ||
    state.forgeMissionProgress.some((m) => m.status !== "available" || m.stepsCompleted.length > 0)
  );
}
