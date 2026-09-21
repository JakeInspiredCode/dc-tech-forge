"use client";

// Typed façade over the shim-dispatched queries and mutations. Hook names and
// semantics match the original Convex-era contracts so call sites stay
// unchanged; only the return types and the underlying runtime differ.

import { useQuery, useMutation } from "@/lib/convex-shim";
import { api } from "../convex/_generated/api";
import type { TopicId, Tier } from "./types";
import type {
  Doc,
  CardFields,
  ReviewFields,
  SessionFields,
  ProgressFields,
  ProfileFields,
  StoryFields,
  SpeedRunFields,
  DrillFields,
} from "./data/schema";

type CardDoc = Doc<CardFields>;
type ReviewDoc = Doc<ReviewFields>;
type SessionDoc = Doc<SessionFields>;
type ProgressDoc = Doc<ProgressFields>;
type ProfileDoc = Doc<ProfileFields>;
type StoryDoc = Doc<StoryFields>;
type SpeedRunDoc = Doc<SpeedRunFields>;
type DrillDoc = Doc<DrillFields>;

// ── Cards ──

export function useCards(): CardDoc[] {
  return (useQuery(api.forgeCards.getAll) as CardDoc[] | undefined) ?? [];
}

export function useCardsByTopic(topicId: TopicId): CardDoc[] {
  return (useQuery(api.forgeCards.getByTopic, { topicId }) as CardDoc[] | undefined) ?? [];
}

export function useDueCards(topicId?: TopicId): CardDoc[] {
  return (useQuery(api.forgeCards.getDue, { topicId }) as CardDoc[] | undefined) ?? [];
}

export function useNewCards(topicId?: TopicId, maxTier?: Tier): CardDoc[] {
  return (
    useQuery(api.forgeCards.getNew, {
      topicId,
      maxTier: maxTier ? Number(maxTier) : undefined,
    }) as CardDoc[] | undefined
  ) ?? [];
}

export function useIsSeeded(): boolean {
  return (useQuery(api.forgeCards.isSeeded) as boolean | undefined) ?? false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSeedCards(): (args: { cards: any[] }) => Promise<unknown> {
  return useMutation(api.forgeCards.seedCards);
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useUpdateCard(): (args: any) => Promise<unknown> {
  return useMutation(api.forgeCards.updateCard);
}

// ── Reviews ──

export function useReviews(limit?: number): ReviewDoc[] {
  return (useQuery(api.forgeReviews.getAll, { limit }) as ReviewDoc[] | undefined) ?? [];
}

export function useRecentReviews(limit?: number): ReviewDoc[] {
  return (useQuery(api.forgeReviews.getRecent, { limit }) as ReviewDoc[] | undefined) ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAddReview(): (args: any) => Promise<unknown> {
  return useMutation(api.forgeReviews.add);
}

// ── Sessions ──

export function useSessions(limit?: number): SessionDoc[] {
  return (useQuery(api.forgeSessions.getAll, { limit }) as SessionDoc[] | undefined) ?? [];
}

export function useRecentSessions(limit?: number): SessionDoc[] {
  return (useQuery(api.forgeSessions.getRecent, { limit }) as SessionDoc[] | undefined) ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAddSession(): (args: any) => Promise<unknown> {
  return useMutation(api.forgeSessions.add);
}

// ── Progress ──

export function useAllProgress(): ProgressDoc[] {
  return (useQuery(api.forgeProgress.getAll) as ProgressDoc[] | undefined) ?? [];
}

export function useTopicProgress(topicId: TopicId): ProgressDoc | null {
  return (
    (useQuery(api.forgeProgress.getByTopic, { topicId }) as ProgressDoc | null | undefined) ?? null
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRecomputeProgress(): (args: { topicId: string }) => Promise<any> {
  return useMutation(api.forgeProgressRecompute.recompute);
}

// ── Profile ──

export function useProfile(): ProfileDoc | null {
  return (useQuery(api.forgeProfile.get) as ProfileDoc | null | undefined) ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useUpsertProfile(): (args: any) => Promise<unknown> {
  return useMutation(api.forgeProfile.upsert);
}

export function useAddPoints(): (args: { points: number }) => Promise<unknown> {
  return useMutation(api.forgeProfile.addPoints);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCheckBadges(): (args?: any) => Promise<{ awarded: string[] }> {
  return useMutation(api.forgeProfile.checkAndAwardBadges);
}

// ── Stories ──

export function useStories(): StoryDoc[] {
  return (useQuery(api.forgeStories.getAll) as StoryDoc[] | undefined) ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useUpsertStory(): (args: any) => Promise<unknown> {
  return useMutation(api.forgeStories.upsert);
}

// ── Speed Runs ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSpeedRunAdd(): (args: any) => Promise<unknown> {
  return useMutation(api.forgeSpeedRuns.add);
}

export function useSpeedRunHistory(topicId?: string): SpeedRunDoc[] {
  return (
    useQuery(api.forgeSpeedRuns.getHistory, { topicId, limit: 10 }) as SpeedRunDoc[] | undefined
  ) ?? [];
}

export function useSpeedRunBestScore(topicId?: string): SpeedRunDoc | null {
  return (
    (useQuery(api.forgeSpeedRuns.getBestScore, { topicId }) as SpeedRunDoc | null | undefined) ??
    null
  );
}

export function useSpeedRunsRecent(limit?: number): SpeedRunDoc[] {
  return (useQuery(api.forgeSpeedRuns.getRecent, { limit }) as SpeedRunDoc[] | undefined) ?? [];
}

// ── Drills ──

export function useDrills(limit?: number): DrillDoc[] {
  return (useQuery(api.forgeDrills.getAll, { limit }) as DrillDoc[] | undefined) ?? [];
}

export function useDrillsByScenario(scenarioId: string): DrillDoc[] {
  return (
    useQuery(api.forgeDrills.getByScenario, { scenarioId }) as DrillDoc[] | undefined
  ) ?? [];
}

export function useRecentDrills(limit?: number): DrillDoc[] {
  return (useQuery(api.forgeDrills.getRecent, { limit }) as DrillDoc[] | undefined) ?? [];
}

export function useDrillBestScore(scenarioId: string): DrillDoc | null {
  return (
    (useQuery(api.forgeDrills.getBestByScenario, { scenarioId }) as DrillDoc | null | undefined) ??
    null
  );
}
