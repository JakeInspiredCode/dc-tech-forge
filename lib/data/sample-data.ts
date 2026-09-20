"use client";

// Pre-fills the account with a plausible few weeks of study, so a visitor can
// see the app "lived in" without doing the work. Loaded at runtime (Settings,
// or a ?demo=1 link) — never baked in at build time.
//
// Two rules keep it honest:
//
//  1. Anything the app derives, we let it derive. Topic mastery, tiers and weak
//     flags are recomputed from per-card SM-2 state, so the sample sets the
//     cards and then runs the app's own recompute. Writing mastery rows
//     directly would just be overwritten with 0% on the next recompute.
//
//  2. Every id comes from the real content — missions, their steps, quick-draw
//     modules, diagnosis scenarios — so the sample can't drift when content is
//     renamed.
//
// It deliberately contains no Story Bank answers and no interview transcripts:
// on a site linked from a résumé, first-person stories read as the author's
// own claims.

import { TOPICS, type TopicId } from "@/lib/types";
import { getMissionsForCampaign } from "@/lib/seeds/campaigns";
import { QUICK_DRAW_MODULES } from "@/lib/seeds/quick-draw-modules";
import diagnosisScenarios from "@/lib/seeds/diagnosis-scenarios";
import { mutations } from "./operations";
import { isSampleDataLoaded, setSampleDataFlag } from "./sample-flag";
import { seedIfEmpty } from "./seed";
import { ENTITY_KEYS, getState, mutateMany, uid } from "./store";
import type { CardFields, Doc, ReviewFields, State } from "./schema";

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysAgo(days: number, hour = 19, minute = 0): string {
  const d = new Date(Date.now() - days * DAY_MS);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString().split("T")[0];
}

// Target mastery per topic — intentionally uneven, so the readiness radar has
// a shape and there are weak areas to "work on". Topics left out stay untouched.
export const SAMPLE_MASTERY: Partial<Record<TopicId, number>> = {
  linux: 72,
  hardware: 58,
  networking: 51,
  "power-cooling": 44,
  "ops-processes": 39,
  fiber: 28,
  scale: 19,
};

// Where the sample learner is in each campaign: the first `accomplished`
// missions are done and the next one is under way.
export const SAMPLE_CAMPAIGNS: ReadonlyArray<{ campaignId: string; accomplished: number }> = [
  { campaignId: "linux-core", accomplished: 4 },
  { campaignId: "hardware-core", accomplished: 2 },
  { campaignId: "networking-core", accomplished: 0 },
];

const STREAK_DAYS = 12;
const LEARNING_SHARE = 0.2;

// ── Cards and reviews ──

// Mastery is (mastered + learning / 2) / total. Hold `learning` at a fixed
// share and solve for `mastered`. A learner clears the low tiers first, so
// cards are taken in tier order.
function planTopic(cards: Doc<CardFields>[], targetPct: number) {
  const ordered = [...cards].sort(
    (a, b) => a.tier - b.tier || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const total = ordered.length;
  const learningCount = Math.round(total * LEARNING_SHARE);
  const masteredCount = Math.max(
    0,
    Math.min(total - learningCount, Math.round((total * targetPct) / 100 - learningCount / 2)),
  );
  return {
    mastered: ordered.slice(0, masteredCount),
    learning: ordered.slice(masteredCount, masteredCount + learningCount),
  };
}

function buildCardsAndReviews(cards: Doc<CardFields>[]) {
  const nextState = new Map<string, Partial<CardFields>>();
  const reviews: Doc<ReviewFields>[] = [];

  const review = (cardId: string, daysAgo: number, slot: number, quality: number) => {
    const timestamp = isoDaysAgo(daysAgo, 19, slot % 50);
    reviews.push({
      _id: uid(),
      _creationTime: Date.parse(timestamp),
      cardId,
      timestamp,
      quality,
      responseTime: 2400 + ((slot * 700) % 4200),
    });
  };

  for (const topic of TOPICS) {
    const target = SAMPLE_MASTERY[topic.id];
    if (target === undefined) continue;
    const { mastered, learning } = planTopic(
      cards.filter((c) => c.topicId === topic.id),
      target,
    );

    mastered.forEach((card, i) => {
      // Last seen 3–11 days ago on a 30-day interval: comfortably not due.
      const daysAgo = 3 + (i % (STREAK_DAYS - 3));
      nextState.set(card.cardId, {
        repetitions: 5,
        interval: 30,
        easeFactor: 2.6,
        lastReview: dateDaysAgo(daysAgo),
        dueDate: dateDaysAgo(daysAgo - 30),
      });
      review(card.cardId, daysAgo, i, i % 3 === 0 ? 4 : 5);
    });

    learning.forEach((card, i) => {
      // Last seen 0–3 days ago on a 3-day interval, so some are due today and
      // the study queue isn't empty.
      const daysAgo = i % 4;
      nextState.set(card.cardId, {
        repetitions: 2,
        interval: 3,
        easeFactor: 2.36,
        lastReview: dateDaysAgo(daysAgo),
        dueDate: dateDaysAgo(daysAgo - 3),
      });
      // Every fifth card was a struggle, which keeps it out of the tier count.
      review(card.cardId, daysAgo, i, i % 5 === 4 ? 2 : 4);
    });
  }

  return {
    cards: cards.map((c) => (nextState.has(c.cardId) ? { ...c, ...nextState.get(c.cardId) } : c)),
    reviews,
  };
}

// ── Everything else ──

function buildSessions(reviews: Doc<ReviewFields>[]): State["forgeSessions"] {
  // Study sessions only. No transcripts, no rubric scores.
  return [1, 3, 6].map((daysAgo, i) => {
    const start = new Date(Date.parse(isoDaysAgo(daysAgo, 20, 30)));
    const end = new Date(start.getTime() + (18 + i * 4) * 60 * 1000);
    const day = dateDaysAgo(daysAgo);
    return {
      _id: uid(),
      _creationTime: start.getTime(),
      type: i === 1 ? "topic-drill" : "daily-training",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      cardIds: reviews.filter((r) => r.timestamp.startsWith(day)).map((r) => r.cardId).slice(0, 20),
      answers: [],
    };
  });
}

function buildMissions(prev: State) {
  const accomplished = new Set<string>();
  const inProgress = new Set<string>();
  const stepIds = new Map<string, string[]>();
  const plan = new Map<string, { index: number; completed: string[] }>();

  for (const { campaignId, accomplished: count } of SAMPLE_CAMPAIGNS) {
    const missions = getMissionsForCampaign(campaignId);
    missions.forEach((m) => stepIds.set(m.id, m.defaultLoadout.map((s) => s.id)));
    const done = missions.slice(0, count).map((m) => m.id);
    done.forEach((id) => accomplished.add(id));
    const current = missions[count];
    if (current) inProgress.add(current.id);
    plan.set(campaignId, { index: count, completed: done });
  }

  const doneOrder = [...accomplished];
  const lastActivityAt = new Date().toISOString();

  const forgeCampaignProgress = prev.forgeCampaignProgress.map((row) => {
    const p = plan.get(row.campaignId);
    if (!p) return row;
    return { ...row, currentMissionIndex: p.index, completedMissions: p.completed, lastActivityAt };
  });

  const forgeMissionProgress = prev.forgeMissionProgress.map((row) => {
    const steps = stepIds.get(row.missionId) ?? [];
    if (accomplished.has(row.missionId)) {
      return {
        ...row,
        status: "accomplished",
        stepsCompleted: steps,
        knowledgeCheckPassed: true,
        knowledgeCheckScore: 88,
        bestScore: 92,
        accomplishedAt: isoDaysAgo(Math.max(1, STREAK_DAYS - 2 - doneOrder.indexOf(row.missionId))),
        lastReviewedAt: isoDaysAgo(2),
        xpEarned: 250,
      };
    }
    if (inProgress.has(row.missionId)) {
      return { ...row, status: "in-progress", stepsCompleted: steps.slice(0, 1), xpEarned: 0 };
    }
    return row;
  });

  return { forgeCampaignProgress, forgeMissionProgress };
}

function buildDiagnosisHistory(): State["forgeDiagnosisHistory"] {
  const scores = [100, 88, 72];
  return diagnosisScenarios.slice(0, scores.length).map((scenario, i) => ({
    _id: uid(),
    _creationTime: Date.now() - (i + 1) * DAY_MS,
    scenarioId: scenario.id,
    completedAt: isoDaysAgo(i + 1),
    difficulty: scenario.difficulty,
    score: scores[i],
    stepsCompleted: scenario.steps.length,
    totalSteps: scenario.steps.length,
    xpEarned: scores[i],
  }));
}

function buildQuickDrawHistory(): State["forgeQuickDrawHistory"] {
  const scores = [94, 80, 73, 67];
  return QUICK_DRAW_MODULES.slice(0, scores.length).map((module, i) => {
    const totalItems = Math.min(module.items.length, 15);
    return {
      _id: uid(),
      _creationTime: Date.now() - (i + 1) * DAY_MS,
      moduleId: module.id,
      completedAt: isoDaysAgo(i + 1, 18, 30),
      score: scores[i],
      totalItems,
      correctItems: Math.round((totalItems * scores[i]) / 100),
      timeMs: 29000 + i * 6000,
      xpEarned: Math.round(scores[i] / 4),
    };
  });
}

function buildProfile(prev: State, reviewCount: number): State["forgeProfile"] {
  const totalPoints = 3425;
  // Count-based badges follow from the numbers above, so they can't overstate.
  const earned = (prefix: string, thresholds: number[], value: number) =>
    thresholds.filter((t) => value >= t).map((t) => `${prefix}-${t}`);

  const badges = [
    "first-forge",
    "first-flip",
    "first-correct",
    "first-topic",
    ...earned("cards", [10, 25, 50, 100, 250, 500], reviewCount),
    ...earned("points", [100, 500, 1000, 5000], totalPoints),
    ...earned("streak", [2, 3, 5, 7, 14, 30], STREAK_DAYS),
    "sessions-3",
    "linux-beginner",
    "network-beginner",
    "hardware-beginner",
    "any-topic-50",
    "tier-2-any",
  ];

  const base = prev.forgeProfile[0];
  return [
    {
      _id: base?._id ?? uid(),
      _creationTime: Date.now() - 21 * DAY_MS,
      profileId: base?.profileId ?? "default",
      streak: STREAK_DAYS,
      lastSessionDate: dateDaysAgo(0),
      totalPoints,
      badges,
      totalSessionMinutes: 287,
    },
  ];
}

// ── Public API ──

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

export { isSampleDataLoaded };

/**
 * Fill the account with sample progress. Refuses to touch an account that has
 * real activity unless `replaceExisting` is set, in which case that activity
 * is discarded first. Resolves to whether the sample was loaded.
 */
export async function loadSampleData(
  options: { replaceExisting?: boolean } = {},
): Promise<boolean> {
  if (hasUserActivity() && !options.replaceExisting) return false;

  // Flag first: the banner re-reads it on each store change, and the last of
  // those happens before this function returns.
  setSampleDataFlag(true);

  if (options.replaceExisting) {
    mutateMany(() => Object.fromEntries(ENTITY_KEYS.map((key) => [key, []])) as Partial<State>);
  }
  seedIfEmpty();

  mutateMany((prev) => {
    const { cards, reviews } = buildCardsAndReviews(prev.forgeCards);
    return {
      forgeCards: cards,
      forgeReviews: reviews,
      forgeSessions: buildSessions(reviews),
      forgeProfile: buildProfile(prev, reviews.length),
      forgeDiagnosisHistory: buildDiagnosisHistory(),
      forgeQuickDrawHistory: buildQuickDrawHistory(),
      ...buildMissions(prev),
    };
  });

  for (const topic of TOPICS) {
    await mutations["forgeProgressRecompute:recompute"]({ topicId: topic.id });
  }

  return true;
}
