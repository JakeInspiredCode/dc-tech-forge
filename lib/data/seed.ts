"use client";

import { getAllSeedCards } from "@/lib/seeds";
import { ALL_CAMPAIGNS, ALL_MISSIONS } from "@/lib/seeds/campaigns";
import type { ForgeCard } from "@/lib/types";
import { getState, replaceState, uid } from "./store";
import type { Doc, State } from "./schema";

// Every campaign the curriculum has (access is open: everyone is enrolled in
// all of them). Taken from the curriculum, so a new campaign can't be forgotten.
const DEFAULT_CAMPAIGN_IDS = ALL_CAMPAIGNS.map((c) => c.id);

function now(): number {
  return Date.now();
}

function toCardDoc(c: ForgeCard): Doc<{
  cardId: string; topicId: string; type: string; front: string; back: string;
  difficulty: number; tier: number; steps?: string[]; sortOrder?: number;
  easeFactor: number; interval: number; repetitions: number; dueDate: string;
  lastReview?: string;
}> {
  return {
    _id: uid(),
    _creationTime: now(),
    cardId: c.id,
    topicId: c.topicId,
    type: c.type,
    front: c.front,
    back: c.back,
    difficulty: c.difficulty,
    tier: c.tier,
    steps: c.steps,
    sortOrder: c.sortOrder,
    easeFactor: c.easeFactor,
    interval: c.interval,
    repetitions: c.repetitions,
    dueDate: c.dueDate,
    lastReview: c.lastReview ?? undefined,
  };
}

// Seed a fresh store if the user has no data. Idempotent — skips any table that
// already has rows.
export function seedIfEmpty(): void {
  const state = getState();
  const patch: Partial<State> = {};

  if (state.forgeCards.length === 0) {
    patch.forgeCards = getAllSeedCards().map(toCardDoc);
  }

  if (state.forgeProfile.length === 0) {
    patch.forgeProfile = [{
      _id: uid(),
      _creationTime: now(),
      profileId: "default",
      streak: 0,
      lastSessionDate: "",
      totalPoints: 0,
      badges: [],
      totalSessionMinutes: 0,
    }];
  }

  if (state.forgeCampaignProgress.length === 0) {
    const ts = new Date().toISOString();
    patch.forgeCampaignProgress = DEFAULT_CAMPAIGN_IDS.map((id) => ({
      _id: uid(),
      _creationTime: now(),
      campaignId: id,
      enrolled: true,
      enrolledAt: ts,
      currentMissionIndex: 0,
      completedMissions: [],
      lastActivityAt: ts,
    }));
  }

  if (state.forgeMissionProgress.length === 0) {
    patch.forgeMissionProgress = ALL_MISSIONS.map((m) => ({
      _id: uid(),
      _creationTime: now(),
      missionId: m.id,
      status: "available",
      stepsCompleted: [],
      knowledgeCheckPassed: false,
      xpEarned: 0,
    }));
  }

  if (Object.keys(patch).length > 0) {
    replaceState(patch);
  }
}

// ── Top-up ───────────────────────────────────────────────────────────────────

export interface TopUpResult {
  cardsAdded: number;
  cardsRefreshed: number;
  missionsAdded: number;
  campaignsAdded: number;
  /** Topics whose card set changed, and so whose derived progress is stale. */
  topicsTouched: string[];
}

const CARD_CONTENT = ["topicId", "type", "front", "back", "difficulty", "tier", "sortOrder"] as const;

/**
 * Bring a returning visitor's saved data up to date with the content this
 * build ships. seedIfEmpty() only fills EMPTY tables, so without this:
 *
 *  - a mission added to the curriculum after someone's first visit had no
 *    progress row — and the mission operations only update existing rows, so
 *    it could be played but never completed: nothing was saved;
 *  - corrected card text reached people only if a developer remembered to bump
 *    a version number, and only if they happened to open the home page.
 *
 * Adds what is missing and refreshes the CONTENT of cards that shipped with
 * the app. It never touches study state (ease, interval, due date, reviews),
 * never touches cards the user made or imported, and never removes anything.
 * Writes nothing when there is nothing to do.
 */
export function topUpSeedContent(): TopUpResult {
  const state = getState();
  const patch: Partial<State> = {};
  const result: TopUpResult = { cardsAdded: 0, cardsRefreshed: 0, missionsAdded: 0, campaignsAdded: 0, topicsTouched: [] };
  const touched = new Set<string>();

  if (state.forgeCards.length > 0) {
    const index = new Map(state.forgeCards.map((c, i) => [c.cardId, i]));
    let cards = state.forgeCards;
    for (const seed of getAllSeedCards()) {
      const at = index.get(seed.id);
      if (at === undefined) {
        if (cards === state.forgeCards) cards = [...cards];
        cards.push(toCardDoc(seed));
        result.cardsAdded++;
        touched.add(seed.topicId);
        continue;
      }
      const saved = cards[at];
      const fresh = { topicId: seed.topicId, type: seed.type, front: seed.front, back: seed.back, difficulty: seed.difficulty, tier: seed.tier, sortOrder: seed.sortOrder, steps: seed.steps };
      const same =
        CARD_CONTENT.every((k) => saved[k] === fresh[k]) && JSON.stringify(saved.steps ?? null) === JSON.stringify(fresh.steps ?? null);
      if (same) continue;
      if (cards === state.forgeCards) cards = [...cards];
      if (saved.topicId !== fresh.topicId || saved.tier !== fresh.tier) {
        touched.add(saved.topicId);
        touched.add(fresh.topicId);
      }
      cards[at] = { ...saved, ...fresh };
      result.cardsRefreshed++;
    }
    if (cards !== state.forgeCards) patch.forgeCards = cards;
  }

  if (state.forgeMissionProgress.length > 0) {
    const have = new Set(state.forgeMissionProgress.map((m) => m.missionId));
    const missing = ALL_MISSIONS.filter((m) => !have.has(m.id));
    if (missing.length > 0) {
      patch.forgeMissionProgress = [
        ...state.forgeMissionProgress,
        ...missing.map((m) => ({
          _id: uid(),
          _creationTime: now(),
          missionId: m.id,
          status: "available" as const,
          stepsCompleted: [],
          knowledgeCheckPassed: false,
          xpEarned: 0,
        })),
      ];
      result.missionsAdded = missing.length;
    }
  }

  if (state.forgeCampaignProgress.length > 0) {
    const have = new Set(state.forgeCampaignProgress.map((c) => c.campaignId));
    const missing = DEFAULT_CAMPAIGN_IDS.filter((id) => !have.has(id));
    if (missing.length > 0) {
      const ts = new Date().toISOString();
      patch.forgeCampaignProgress = [
        ...state.forgeCampaignProgress,
        ...missing.map((id) => ({
          _id: uid(),
          _creationTime: now(),
          campaignId: id,
          enrolled: true,
          enrolledAt: ts,
          currentMissionIndex: 0,
          completedMissions: [],
          lastActivityAt: ts,
        })),
      ];
      result.campaignsAdded = missing.length;
    }
  }

  if (Object.keys(patch).length > 0) replaceState(patch);
  result.topicsTouched = [...touched];
  return result;
}
