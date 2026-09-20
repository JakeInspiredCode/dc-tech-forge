"use client";

import { getState, mutate, mutateMany, uid } from "./store";
import type {
  CardFields,
  DrillFields,
  MissionProgressFields,
  ProfileFields,
  ProgressFields,
  SessionFields,
  SpeedRunFields,
  State,
  StoryFields,
  TicketHistoryFields,
  DiagnosisHistoryFields,
  QuickDrawHistoryFields,
  BountyHistoryFields,
  CampaignProgressFields,
  Doc,
} from "./schema";

const nowTs = () => Date.now();
const todayIso = () => new Date().toISOString().split("T")[0];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = Record<string, any>;
type QueryFn = (args: Args) => unknown;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationFn = (args: Args) => any;

// ── Queries ──────────────────────────────────────────────────────────────────

export const queries: Record<string, QueryFn> = {
  // forgeCards
  "forgeCards:getAll": () => getState().forgeCards,
  "forgeCards:getByTopic": ({ topicId }) =>
    getState().forgeCards.filter((c) => c.topicId === topicId),
  "forgeCards:getByTopicTier": ({ topicId, tier }) =>
    getState().forgeCards.filter((c) => c.topicId === topicId && c.tier === tier),
  "forgeCards:getByCardId": ({ cardId }) =>
    getState().forgeCards.find((c) => c.cardId === cardId) ?? null,
  "forgeCards:getDue": ({ topicId }) => {
    const today = todayIso();
    return getState().forgeCards.filter(
      (c) => c.dueDate <= today && (!topicId || c.topicId === topicId),
    );
  },
  "forgeCards:getNew": ({ topicId, maxTier }) =>
    getState().forgeCards.filter((c) => {
      if (c.repetitions !== 0) return false;
      if (topicId && c.topicId !== topicId) return false;
      if (maxTier != null && c.tier > maxTier) return false;
      return true;
    }),
  "forgeCards:isSeeded": () => getState().forgeCards.length > 0,

  // forgeReviews
  "forgeReviews:getAll": ({ limit }) => {
    const all = [...getState().forgeReviews].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    return all.slice(0, limit ?? 1000);
  },
  "forgeReviews:getByCard": ({ cardId }) =>
    getState().forgeReviews.filter((r) => r.cardId === cardId),
  "forgeReviews:getRecent": ({ limit }) => {
    const all = [...getState().forgeReviews].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    return all.slice(0, limit ?? 100);
  },

  // forgeSessions
  "forgeSessions:getAll": ({ limit }) => {
    const all = [...getState().forgeSessions].sort((a, b) =>
      b.startTime.localeCompare(a.startTime),
    );
    return all.slice(0, limit ?? 500);
  },
  "forgeSessions:getRecent": ({ limit }) => {
    const all = [...getState().forgeSessions].sort((a, b) =>
      b.startTime.localeCompare(a.startTime),
    );
    return all.slice(0, limit ?? 10);
  },

  // forgeProfile
  "forgeProfile:get": () =>
    getState().forgeProfile.find((p) => p.profileId === "default") ?? null,

  // forgeProgress
  "forgeProgress:getAll": () => getState().forgeProgress,
  "forgeProgress:getByTopic": ({ topicId }) =>
    getState().forgeProgress.find((p) => p.topicId === topicId) ?? null,

  // forgeStories
  "forgeStories:getAll": () => getState().forgeStories,

  // forgeSpeedRuns
  "forgeSpeedRuns:getHistory": ({ topicId, limit }) => {
    const max = limit ?? 10;
    const runs = topicId
      ? getState().forgeSpeedRuns.filter((r) => r.topicId === topicId)
      : [...getState().forgeSpeedRuns];
    runs.sort((a, b) => b.totalPoints - a.totalPoints);
    return runs.slice(0, max);
  },
  "forgeSpeedRuns:getBestScore": ({ topicId }) => {
    const runs = topicId
      ? getState().forgeSpeedRuns.filter((r) => r.topicId === topicId)
      : getState().forgeSpeedRuns;
    if (runs.length === 0) return null;
    return runs.reduce((best, r) => (r.totalPoints > best.totalPoints ? r : best));
  },
  "forgeSpeedRuns:getRecent": ({ limit }) => {
    const all = [...getState().forgeSpeedRuns].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    return all.slice(0, limit ?? 5);
  },

  // forgeDrills
  "forgeDrills:getAll": ({ limit }) => {
    const all = [...getState().forgeDrills].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    return all.slice(0, limit ?? 500);
  },
  "forgeDrills:getByScenario": ({ scenarioId }) =>
    getState().forgeDrills.filter((d) => d.scenarioId === scenarioId),
  "forgeDrills:getRecent": ({ limit }) => {
    const all = [...getState().forgeDrills].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    return all.slice(0, limit ?? 10);
  },
  "forgeDrills:getBestByScenario": ({ scenarioId }) => {
    const runs = getState().forgeDrills.filter((d) => d.scenarioId === scenarioId);
    if (runs.length === 0) return null;
    return runs.reduce((best, r) =>
      r.overallTermHitRate > best.overallTermHitRate ? r : best,
    );
  },

  // forgeMissions
  "forgeMissions:getMissionState": ({ missionId }) =>
    getState().forgeMissionProgress.find((m) => m.missionId === missionId) ?? null,
  "forgeMissions:getAllMissionStates": () => getState().forgeMissionProgress,
  "forgeMissions:getMissionsByStatus": ({ status }) =>
    getState().forgeMissionProgress.filter((m) => m.status === status),

  // forgeCampaigns
  "forgeCampaigns:getCampaignState": ({ campaignId }) =>
    getState().forgeCampaignProgress.find((c) => c.campaignId === campaignId) ?? null,
  "forgeCampaigns:getAllCampaignStates": () => getState().forgeCampaignProgress,
  "forgeCampaigns:getEnrolledCampaigns": () =>
    getState().forgeCampaignProgress.filter((c) => c.enrolled),

  // forgeBounties (history)
  "forgeBounties:getBountyHistory": ({ bountyId }) =>
    getState().forgeBountyHistory.filter((b) => b.bountyId === bountyId),
  "forgeBounties:getRecentBounties": ({ limit }) => {
    const all = [...getState().forgeBountyHistory].sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt),
    );
    return all.slice(0, limit ?? 20);
  },
  "forgeBounties:getAllBountyHistory": () => getState().forgeBountyHistory,
  "forgeBounties:getBestBountyScore": ({ bountyId }) => {
    const records = getState().forgeBountyHistory.filter((b) => b.bountyId === bountyId);
    if (records.length === 0) return null;
    return records.reduce((best, r) => (r.score > best.score ? r : best));
  },

  // forgeDiagnosisHistory
  "forgeDiagnosisHistory:getByScenario": ({ scenarioId }) =>
    getState().forgeDiagnosisHistory.filter((h) => h.scenarioId === scenarioId),
  "forgeDiagnosisHistory:getBestByScenario": ({ scenarioId }) => {
    const records = getState().forgeDiagnosisHistory.filter((h) => h.scenarioId === scenarioId);
    if (records.length === 0) return null;
    return records.reduce((best, r) => (r.score > best.score ? r : best));
  },
  "forgeDiagnosisHistory:getRecent": ({ limit }) => {
    const all = [...getState().forgeDiagnosisHistory].sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt),
    );
    return all.slice(0, limit ?? 20);
  },

  // forgeQuickDrawHistory
  "forgeQuickDrawHistory:getByModule": ({ moduleId }) =>
    getState().forgeQuickDrawHistory.filter((h) => h.moduleId === moduleId),
  "forgeQuickDrawHistory:getBestByModule": ({ moduleId }) => {
    const records = getState().forgeQuickDrawHistory.filter((h) => h.moduleId === moduleId);
    if (records.length === 0) return null;
    return records.reduce((best, r) => (r.score > best.score ? r : best));
  },
  "forgeQuickDrawHistory:getRecent": ({ limit }) => {
    const all = [...getState().forgeQuickDrawHistory].sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt),
    );
    return all.slice(0, limit ?? 20);
  },

  // forgeTicketHistory
  "forgeTicketHistory:getByTicket": ({ ticketId }) =>
    getState().forgeTicketHistory.filter((h) => h.ticketId === ticketId),
  "forgeTicketHistory:getBestByTicket": ({ ticketId }) => {
    const records = getState().forgeTicketHistory.filter((h) => h.ticketId === ticketId);
    if (records.length === 0) return null;
    return records.reduce((best, r) => (r.score > best.score ? r : best));
  },
  "forgeTicketHistory:getByDifficulty": ({ difficulty }) =>
    getState().forgeTicketHistory.filter((h) => h.difficulty === difficulty),
  "forgeTicketHistory:getRecent": ({ limit }) => {
    const all = [...getState().forgeTicketHistory].sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt),
    );
    return all.slice(0, limit ?? 20);
  },
  "forgeTicketHistory:getAll": () => getState().forgeTicketHistory,

};

// ── Mutations ────────────────────────────────────────────────────────────────

const newDoc = <T extends object>(fields: T): Doc<T> => ({
  _id: uid(),
  _creationTime: nowTs(),
  ...fields,
});

function upsertProfileBase(): Doc<ProfileFields> {
  return newDoc({
    profileId: "default",
    streak: 0,
    lastSessionDate: "",
    totalPoints: 0,
    badges: [],
    totalSessionMinutes: 0,
  });
}

export const mutations: Record<string, MutationFn> = {
  // ── forgeCards ────────────────────────────────────────────────────────────

  "forgeCards:addCard": async (args) => {
    const existing = getState().forgeCards.find((c) => c.cardId === args.cardId);
    if (existing) return { error: "Card with this ID already exists", id: null };
    const doc = newDoc<CardFields>({
      cardId: args.cardId,
      topicId: args.topicId,
      type: args.type,
      front: args.front,
      back: args.back,
      difficulty: args.difficulty,
      tier: args.tier,
      steps: args.steps,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: todayIso(),
    });
    mutate("forgeCards", (prev) => [...prev, doc]);
    return { error: null, id: doc._id };
  },

  "forgeCards:updateCard": async (args) => {
    let found: string | null = null;
    mutate("forgeCards", (prev) =>
      prev.map((c) => {
        if (c.cardId !== args.cardId) return c;
        found = c._id;
        return {
          ...c,
          easeFactor: args.easeFactor,
          interval: args.interval,
          repetitions: args.repetitions,
          dueDate: args.dueDate,
          lastReview: args.lastReview,
        };
      }),
    );
    return found;
  },

  "forgeCards:deleteByTopic": async ({ topicId }) => {
    let count = 0;
    mutate("forgeCards", (prev) => {
      const keep = prev.filter((c) => c.topicId !== topicId);
      count = prev.length - keep.length;
      return keep;
    });
    return count;
  },

  "forgeCards:seedCards": async ({ cards }) => {
    let inserted = 0;
    mutate("forgeCards", (prev) => {
      const byId = new Set(prev.map((c) => c.cardId));
      const additions: Doc<CardFields>[] = [];
      for (const card of cards as CardFields[]) {
        if (byId.has(card.cardId)) continue;
        additions.push(newDoc<CardFields>(card));
        inserted++;
      }
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
    return inserted;
  },

  "forgeCards:reseedCards": async ({ cards }) => {
    let inserted = 0;
    let updated = 0;
    mutate("forgeCards", (prev) => {
      const byId = new Map(prev.map((c) => [c.cardId, c]));
      for (const card of cards as CardFields[]) {
        const existing = byId.get(card.cardId);
        if (existing) {
          byId.set(card.cardId, {
            ...existing,
            front: card.front, back: card.back, topicId: card.topicId,
            type: card.type, difficulty: card.difficulty, tier: card.tier,
            steps: card.steps, sortOrder: card.sortOrder,
          });
          updated++;
        } else {
          const doc = newDoc<CardFields>(card);
          byId.set(card.cardId, doc);
          inserted++;
        }
      }
      return Array.from(byId.values());
    });
    return { inserted, updated };
  },

  "forgeCards:dedup": async () => {
    let deleted = 0;
    mutate("forgeCards", (prev) => {
      const groups = new Map<string, typeof prev>();
      for (const card of prev) {
        const list = groups.get(card.cardId) ?? [];
        list.push(card);
        groups.set(card.cardId, list);
      }
      const keep: typeof prev = [];
      for (const list of groups.values()) {
        if (list.length === 1) {
          keep.push(list[0]);
        } else {
          list.sort((a, b) => (b.repetitions ?? 0) - (a.repetitions ?? 0));
          keep.push(list[0]);
          deleted += list.length - 1;
        }
      }
      return keep;
    });
    return deleted;
  },

  // ── forgeReviews ──────────────────────────────────────────────────────────

  "forgeReviews:add": async (args) => {
    const doc = newDoc({
      cardId: args.cardId,
      timestamp: args.timestamp,
      quality: args.quality,
      responseTime: args.responseTime,
    });
    mutate("forgeReviews", (prev) => [...prev, doc]);
    return doc._id;
  },

  // ── forgeSessions ─────────────────────────────────────────────────────────

  "forgeSessions:add": async (args) => {
    const doc = newDoc<SessionFields>({
      type: args.type,
      startTime: args.startTime,
      endTime: args.endTime,
      cardIds: args.cardIds,
      answers: args.answers,
      overallScore: args.overallScore,
    });
    mutate("forgeSessions", (prev) => [...prev, doc]);
    return doc._id;
  },

  // ── forgeProfile ──────────────────────────────────────────────────────────

  "forgeProfile:upsert": async (args) => {
    let id: string | null = null;
    mutate("forgeProfile", (prev) => {
      const existing = prev.find((p) => p.profileId === "default");
      if (existing) {
        id = existing._id;
        return prev.map((p) =>
          p.profileId === "default" ? { ...p, ...args } : p,
        );
      }
      const doc = newDoc<ProfileFields>({ profileId: "default", ...(args as Omit<ProfileFields, "profileId">) });
      id = doc._id;
      return [...prev, doc];
    });
    return id;
  },

  "forgeProfile:addPoints": async ({ points }) => {
    let id: string | null = null;
    mutate("forgeProfile", (prev) => {
      const existing = prev.find((p) => p.profileId === "default");
      if (!existing) {
        const doc = { ...upsertProfileBase(), totalPoints: points };
        id = doc._id;
        return [...prev, doc];
      }
      const multiplier = existing.streak >= 3 ? 2 : 1;
      id = existing._id;
      return prev.map((p) =>
        p.profileId === "default"
          ? { ...p, totalPoints: p.totalPoints + points * multiplier }
          : p,
      );
    });
    return id;
  },

  "forgeProfile:recordSessionComplete": async ({ sessionMinutes }) => {
    const today = todayIso();
    let id: string | null = null;
    mutate("forgeProfile", (prev) => {
      const existing = prev.find((p) => p.profileId === "default");
      if (!existing) {
        const doc: Doc<ProfileFields> = {
          ...upsertProfileBase(),
          streak: 1,
          lastSessionDate: today,
          totalSessionMinutes: sessionMinutes,
        };
        id = doc._id;
        return [...prev, doc];
      }
      id = existing._id;
      if (existing.lastSessionDate === today) {
        return prev.map((p) =>
          p.profileId === "default"
            ? { ...p, totalSessionMinutes: p.totalSessionMinutes + sessionMinutes }
            : p,
        );
      }
      const lastDate = new Date(existing.lastSessionDate + "T00:00:00");
      const todayDate = new Date(today + "T00:00:00");
      const diffDays = Math.round(
        (todayDate.getTime() - lastDate.getTime()) / 86400000,
      );
      const newStreak = diffDays === 1 ? existing.streak + 1 : 1;
      return prev.map((p) =>
        p.profileId === "default"
          ? {
              ...p,
              streak: newStreak,
              lastSessionDate: today,
              totalSessionMinutes: p.totalSessionMinutes + sessionMinutes,
            }
          : p,
      );
    });
    return id;
  },

  "forgeProfile:checkAndAwardBadges": async (args) => {
    const state = getState();
    const profile = state.forgeProfile.find((p) => p.profileId === "default");
    if (!profile) return { awarded: [] };

    const has = new Set(profile.badges);
    const earn: string[] = [];
    const maybe = (id: string) => {
      if (!has.has(id)) earn.push(id);
    };

    const reviewCount = args.reviewCount ?? state.forgeReviews.length;
    const sessionCount = args.sessionCount ?? state.forgeSessions.length;
    const speedRunCount = args.speedRunCount ?? state.forgeSpeedRuns.length;
    const drillCount = args.drillCount ?? state.forgeDrills.length;
    const progress = state.forgeProgress;

    // First-time
    if (sessionCount > 0) maybe("first-forge");
    if (reviewCount > 0) { maybe("first-flip"); maybe("first-topic"); }
    if (speedRunCount > 0) maybe("first-speed");
    if (!has.has("first-correct")) {
      const hasCorrect =
        args.hasCorrectReview ??
        state.forgeReviews.some((r) => r.quality >= 5);
      if (hasCorrect) maybe("first-correct");
    }
    // Volume
    if (reviewCount >= 10) maybe("cards-10");
    if (reviewCount >= 25) maybe("cards-25");
    if (reviewCount >= 50) maybe("cards-50");
    if (reviewCount >= 100) maybe("cards-100");
    if (reviewCount >= 250) maybe("cards-250");
    if (reviewCount >= 500) maybe("cards-500");

    // Points
    if (profile.totalPoints >= 100) maybe("points-100");
    if (profile.totalPoints >= 500) maybe("points-500");
    if (profile.totalPoints >= 1000) maybe("points-1000");
    if (profile.totalPoints >= 5000) maybe("points-5000");

    // Streaks
    if (profile.streak >= 2) maybe("streak-2");
    if (profile.streak >= 3) maybe("streak-3");
    if (profile.streak >= 5) maybe("streak-5");
    if (profile.streak >= 7) maybe("streak-7");
    if (profile.streak >= 14) maybe("streak-14");
    if (profile.streak >= 30) maybe("streak-30");

    // Sessions
    if (sessionCount >= 3) maybe("sessions-3");
    if (sessionCount >= 10) maybe("sessions-10");
    if (sessionCount >= 25) maybe("sessions-25");

    // Speed runs
    if (speedRunCount >= 3) maybe("speed-run-3");
    if (speedRunCount >= 10) maybe("speed-run-10");
    const bestStreakDB = state.forgeSpeedRuns.reduce(
      (m, r) => Math.max(m, r.bestStreak ?? 0),
      0,
    );
    const bestStreak = Math.max(bestStreakDB, args.speedRunBestStreak ?? 0);
    if (bestStreak >= 3) maybe("speed-3-streak");
    if (bestStreak >= 5) maybe("speed-5-streak");
    if (bestStreak >= 10) maybe("speed-10-streak");
    const hasPerfect =
      state.forgeSpeedRuns.some(
        (r) => r.totalCards >= 5 && r.correctCards === r.totalCards,
      ) ||
      (args.speedRunCorrect != null &&
        args.speedRunTotal != null &&
        args.speedRunTotal >= 5 &&
        args.speedRunCorrect === args.speedRunTotal);
    if (hasPerfect) maybe("speed-perfect-5");

    // Topic mastery
    const masteryOf = (topicId: string) =>
      progress.find((p) => p.topicId === topicId)?.masteryPercent ?? 0;
    if (masteryOf("linux") >= 25) maybe("linux-beginner");
    if (masteryOf("linux") >= 90) maybe("linux-lord");
    if (masteryOf("networking") >= 25) maybe("network-beginner");
    if (masteryOf("networking") >= 90) maybe("network-pro");
    if (masteryOf("hardware") >= 25) maybe("hardware-beginner");
    if (masteryOf("hardware") >= 90) maybe("hardware-pro");
    if (progress.some((p) => p.masteryPercent >= 50)) maybe("any-topic-50");
    if (progress.length >= 8 && progress.every((p) => p.masteryPercent >= 25)) {
      maybe("all-topics-25");
    }
    if (progress.length >= 8 && progress.every((p) => p.masteryPercent >= 50)) {
      maybe("all-topics-50");
    }
    if (progress.length > 0) {
      const avg = progress.reduce((s, p) => s + p.masteryPercent, 0) / progress.length;
      if (avg >= 90) maybe("colossus-ready");
    }

    // Tiers
    if (progress.some((p) => p.currentTier >= 2)) maybe("tier-2-any");
    if (progress.some((p) => p.currentTier >= 3)) maybe("tier-3-any");
    if (progress.some((p) => p.currentTier >= 4)) maybe("tier-breaker");

    // Mock master
    if (!has.has("mock-master")) {
      const mockCount = state.forgeSessions.filter((s) => s.type === "mock-interview").length;
      if (mockCount >= 5) maybe("mock-master");
    }

    // Scenario slayer
    if (!has.has("scenario-slayer")) {
      const scenarioIds = new Set(
        state.forgeCards.filter((c) => c.type === "scenario").map((c) => c.cardId),
      );
      const scenarioReviewCount = state.forgeReviews.filter((r) =>
        scenarioIds.has(r.cardId),
      ).length;
      if (scenarioReviewCount >= 50) maybe("scenario-slayer");
    }

    // Speed demon
    if (!has.has("speed-demon")) {
      const sped = state.forgeSessions.find((s) => {
        if (s.cardIds.length < 20 || !s.endTime || !s.startTime) return false;
        const dur =
          (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) /
          60000;
        return dur < 45;
      });
      if (sped) maybe("speed-demon");
    }

    if (args.sessionAllGoodOrEasy) maybe("perfect-session");

    // Drill badges
    if (drillCount > 0) maybe("first-drill");
    if (drillCount >= 3) maybe("drill-3");
    if (drillCount >= 10) maybe("drill-10");
    if (state.forgeDrills.some((d) => d.overallTermHitRate === 100)) {
      maybe("drill-perfect");
    }
    if (state.forgeDrills.some((d) => d.overallTermHitRate >= 80)) maybe("drill-80");
    const uniqueScenarios = new Set(state.forgeDrills.map((d) => d.scenarioId));
    if (uniqueScenarios.size >= 5) maybe("drill-all-scenarios");

    if (earn.length > 0) {
      mutate("forgeProfile", (prev) =>
        prev.map((p) =>
          p.profileId === "default"
            ? { ...p, badges: [...p.badges, ...earn] }
            : p,
        ),
      );
    }
    return { awarded: earn };
  },

  // ── forgeProgress ─────────────────────────────────────────────────────────

  "forgeProgress:upsert": async (args) => {
    let id: string | null = null;
    mutate("forgeProgress", (prev) => {
      const existing = prev.find((p) => p.topicId === args.topicId);
      if (existing) {
        id = existing._id;
        return prev.map((p) => (p.topicId === args.topicId ? { ...p, ...args } : p));
      }
      const doc = newDoc<ProgressFields>(args as ProgressFields);
      id = doc._id;
      return [...prev, doc];
    });
    return id;
  },

  "forgeProgressRecompute:recompute": async ({ topicId }) => {
    const state = getState();
    const cards = state.forgeCards.filter((c) => c.topicId === topicId);
    const today = todayIso();
    const tiers: Record<string, { total: number; qualified: number }> = {
      tier1: { total: 0, qualified: 0 },
      tier2: { total: 0, qualified: 0 },
      tier3: { total: 0, qualified: 0 },
      tier4: { total: 0, qualified: 0 },
    };
    let mastered = 0, learning = 0, newCount = 0;

    // Build latest-review-per-card lookup once — avoids O(cards × reviews) filter+sort.
    const latestReviewByCard = new Map<string, { timestamp: string; quality: number }>();
    for (const r of state.forgeReviews) {
      const prev = latestReviewByCard.get(r.cardId);
      if (!prev || r.timestamp.localeCompare(prev.timestamp) > 0) {
        latestReviewByCard.set(r.cardId, { timestamp: r.timestamp, quality: r.quality });
      }
    }

    for (const card of cards) {
      const tierKey = `tier${card.tier}`;
      if (tiers[tierKey]) tiers[tierKey].total++;
      if (card.repetitions === 0) {
        newCount++;
      } else if (card.interval >= 21) {
        mastered++;
        if (tiers[tierKey]) tiers[tierKey].qualified++;
      } else {
        learning++;
        const latest = latestReviewByCard.get(card.cardId);
        if (latest && latest.quality >= 3 && tiers[tierKey]) {
          tiers[tierKey].qualified++;
        }
      }
    }

    let currentTier = 1;
    const t1 = tiers.tier1;
    if (t1.total > 0 && t1.qualified / t1.total >= 0.7) currentTier = 2;
    const t2 = tiers.tier2;
    if (currentTier >= 2 && t2.total > 0 && t2.qualified / t2.total >= 0.7) {
      currentTier = 3;
    }
    const t3 = tiers.tier3;
    if (currentTier >= 3 && t3.total > 0) {
      const t3Cards = cards.filter((c) => c.tier === 3 && c.interval >= 3);
      if (t3Cards.length / t3.total >= 0.8) currentTier = 4;
    }

    const masteryPercent = cards.length > 0
      ? Math.round(((mastered + learning * 0.5) / cards.length) * 100)
      : 0;

    const next: ProgressFields = {
      topicId,
      masteryPercent,
      currentTier,
      tierProgress: tiers as ProgressFields["tierProgress"],
      totalCards: cards.length,
      masteredCards: mastered,
      learningCards: learning,
      newCards: newCount,
      weakFlag: masteryPercent < 85,
      lastUpdated: today,
    };

    let resultId: string = "";
    let previousTier = 0;
    mutate("forgeProgress", (prev) => {
      const existing = prev.find((p) => p.topicId === topicId);
      if (existing) {
        previousTier = existing.currentTier;
        resultId = existing._id;
        return prev.map((p) => (p.topicId === topicId ? { ...p, ...next } : p));
      }
      const doc = newDoc<ProgressFields>(next);
      resultId = doc._id;
      return [...prev, doc];
    });
    return { ...next, _id: resultId, previousTier };
  },

  // ── forgeStories ──────────────────────────────────────────────────────────

  "forgeStories:upsert": async (args) => {
    let id: string | null = null;
    mutate("forgeStories", (prev) => {
      const existing = prev.find((s) => s.storyId === args.storyId);
      if (existing) {
        id = existing._id;
        return prev.map((s) => (s.storyId === args.storyId ? { ...s, ...args } : s));
      }
      const doc = newDoc<StoryFields>(args as StoryFields);
      id = doc._id;
      return [...prev, doc];
    });
    return id;
  },

  // ── forgeSpeedRuns ────────────────────────────────────────────────────────

  "forgeSpeedRuns:add": async (args) => {
    const doc = newDoc<SpeedRunFields>(args as SpeedRunFields);
    mutate("forgeSpeedRuns", (prev) => [...prev, doc]);
    return doc._id;
  },

  // ── forgeDrills ───────────────────────────────────────────────────────────

  "forgeDrills:add": async (args) => {
    const doc = newDoc<DrillFields>(args as DrillFields);
    mutate("forgeDrills", (prev) => [...prev, doc]);
    return doc._id;
  },

  // ── forgeMissions ─────────────────────────────────────────────────────────

  "forgeMissions:initMissionState": async ({ missionId, status }) => {
    let id: string | null = null;
    mutate("forgeMissionProgress", (prev) => {
      const existing = prev.find((m) => m.missionId === missionId);
      if (existing) {
        id = existing._id;
        return prev;
      }
      const doc = newDoc<MissionProgressFields>({
        missionId,
        status,
        stepsCompleted: [],
        knowledgeCheckPassed: false,
        xpEarned: 0,
      });
      id = doc._id;
      return [...prev, doc];
    });
    return id;
  },

  "forgeMissions:updateMissionStatus": async ({ missionId, status }) => {
    mutate("forgeMissionProgress", (prev) =>
      prev.map((m) => {
        if (m.missionId !== missionId) return m;
        // Completion is permanent. The mission player reports "in-progress"
        // whenever a mission is opened, and reopening a finished mission to
        // review it must not take it off the map.
        if (m.status === "accomplished" && status !== "accomplished") return m;
        return { ...m, status };
      }),
    );
  },

  "forgeMissions:completeMissionStep": async ({ missionId, stepId }) => {
    mutate("forgeMissionProgress", (prev) =>
      prev.map((m) => {
        if (m.missionId !== missionId) return m;
        if (m.stepsCompleted.includes(stepId)) return m;
        return { ...m, stepsCompleted: [...m.stepsCompleted, stepId] };
      }),
    );
  },

  "forgeMissions:updateLoadout": async ({ missionId, customLoadout }) => {
    mutate("forgeMissionProgress", (prev) =>
      prev.map((m) => (m.missionId === missionId ? { ...m, customLoadout } : m)),
    );
  },

  "forgeMissions:submitKnowledgeCheck": async ({ missionId, score, passed, xpEarned }) => {
    const now = new Date().toISOString();
    let result = { passed, score, bestScore: score, xpEarned };
    mutate("forgeMissionProgress", (prev) =>
      prev.map((m) => {
        if (m.missionId !== missionId) return m;
        const bestScore = Math.max(score, m.bestScore ?? 0);
        result = { passed, score, bestScore, xpEarned };
        const patch: Partial<MissionProgressFields> = {
          knowledgeCheckPassed: passed || m.knowledgeCheckPassed,
          knowledgeCheckScore: score,
          bestScore,
        };
        if (passed) {
          patch.status = "accomplished";
          patch.accomplishedAt = now;
          patch.lastReviewedAt = now;
          patch.xpEarned = m.xpEarned + xpEarned;
        }
        return { ...m, ...patch };
      }),
    );
    return result;
  },

  // ── forgeCampaigns ────────────────────────────────────────────────────────

  "forgeCampaigns:enrollCampaign": async ({ campaignId }) => {
    const now = new Date().toISOString();
    let id: string | null = null;
    mutate("forgeCampaignProgress", (prev) => {
      const existing = prev.find((c) => c.campaignId === campaignId);
      if (existing) {
        id = existing._id;
        return prev.map((c) =>
          c.campaignId === campaignId
            ? { ...c, enrolled: true, enrolledAt: now, lastActivityAt: now }
            : c,
        );
      }
      const doc = newDoc<CampaignProgressFields>({
        campaignId,
        enrolled: true,
        enrolledAt: now,
        currentMissionIndex: 0,
        completedMissions: [],
        lastActivityAt: now,
      });
      id = doc._id;
      return [...prev, doc];
    });
    return id;
  },

  "forgeCampaigns:advanceMission": async ({ campaignId, completedMissionId }) => {
    const now = new Date().toISOString();
    mutate("forgeCampaignProgress", (prev) =>
      prev.map((c) => {
        if (c.campaignId !== campaignId) return c;
        const completed = c.completedMissions.includes(completedMissionId)
          ? c.completedMissions
          : [...c.completedMissions, completedMissionId];
        return {
          ...c,
          completedMissions: completed,
          currentMissionIndex: completed.length,
          lastActivityAt: now,
        };
      }),
    );
  },

  "forgeCampaigns:unenrollCampaign": async ({ campaignId }) => {
    mutate("forgeCampaignProgress", (prev) =>
      prev.map((c) =>
        c.campaignId === campaignId ? { ...c, enrolled: false } : c,
      ),
    );
  },

  // ── forgeBounties ─────────────────────────────────────────────────────────

  "forgeBounties:completeBounty": async ({ bountyId, score, xpEarned }) => {
    const doc = newDoc<BountyHistoryFields>({
      bountyId,
      completedAt: new Date().toISOString(),
      score,
      xpEarned,
    });
    mutate("forgeBountyHistory", (prev) => [...prev, doc]);
    return doc._id;
  },

  // ── forgeDiagnosisHistory ─────────────────────────────────────────────────

  "forgeDiagnosisHistory:add": async (args) => {
    const doc = newDoc<DiagnosisHistoryFields>({
      scenarioId: args.scenarioId,
      difficulty: args.difficulty,
      score: args.score,
      stepsCompleted: args.stepsCompleted,
      totalSteps: args.totalSteps,
      xpEarned: args.xpEarned,
      completedAt: new Date().toISOString(),
    });
    mutate("forgeDiagnosisHistory", (prev) => [...prev, doc]);
    return doc._id;
  },

  // ── forgeQuickDrawHistory ─────────────────────────────────────────────────

  "forgeQuickDrawHistory:add": async (args) => {
    const doc = newDoc<QuickDrawHistoryFields>({
      moduleId: args.moduleId,
      score: args.score,
      totalItems: args.totalItems,
      correctItems: args.correctItems,
      timeMs: args.timeMs,
      xpEarned: args.xpEarned,
      completedAt: new Date().toISOString(),
    });
    mutate("forgeQuickDrawHistory", (prev) => [...prev, doc]);
    return doc._id;
  },

  // ── forgeTicketHistory ────────────────────────────────────────────────────

  "forgeTicketHistory:add": async (args) => {
    const doc = newDoc<TicketHistoryFields>({
      ticketId: args.ticketId,
      difficulty: args.difficulty,
      score: args.score,
      commandsUsed: args.commandsUsed,
      answer: args.answer,
      usedHint: args.usedHint,
      xpEarned: args.xpEarned,
      timeMs: args.timeMs,
      completedAt: new Date().toISOString(),
    });
    mutate("forgeTicketHistory", (prev) => [...prev, doc]);
    return doc._id;
  },
};

// Suppress "unused" warning — `mutateMany` is exported for future cross-entity
// transactions; kept deliberately even if no current op uses it.
void mutateMany;
