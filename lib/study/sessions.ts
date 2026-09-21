import { sortByPriority } from "@/lib/sm2";
import { TOPICS, type ForgeCard } from "@/lib/types";

// Which cards each kind of study session would contain. Computed up front so
// the hub can say how many there are — and refuse to start an empty one. It
// used to build the list on click, and an empty list silently did nothing.

export const LEARN_PER_TOPIC = 10;
export const LEARN_PER_SESSION = 30;
export const DRILL_PER_SESSION = 20;

interface TopicTier {
  topicId: string;
  currentTier: number;
}

const tierOf = (progress: TopicTier[], topicId: string) =>
  progress.find((p) => p.topicId === topicId)?.currentTier ?? 1;

/**
 * Never studied. Every card starts with today as its due date, so "due" alone
 * made a brand-new account read "374 due" and made Review and Learn the same
 * cards on day one. New = never studied; due = studied before and scheduled.
 * (`repetitions === 0` can't tell them apart: SM-2 resets it on a lapse too.)
 */
export const isUnseen = (card: ForgeCard): boolean => card.lastReview === null;

/** Cards studied before that are due again, most urgent first. */
export function reviewSession(dueCards: ForgeCard[]): ForgeCard[] {
  return sortByPriority(dueCards.filter((c) => !isUnseen(c)));
}

/** New cards from tiers already unlocked: a few per topic, so one topic can't crowd out the rest. */
export function learnSession(newCards: ForgeCard[], progress: TopicTier[]): ForgeCard[] {
  return TOPICS.flatMap((topic) =>
    newCards
      .filter((c) => isUnseen(c) && c.topicId === topic.id && c.tier <= tierOf(progress, topic.id))
      .slice(0, LEARN_PER_TOPIC),
  ).slice(0, LEARN_PER_SESSION);
}

/** How many new cards are available at all in the unlocked tiers (a session takes only some). */
export function learnableCount(newCards: ForgeCard[], progress: TopicTier[]): number {
  return newCards.filter((c) => isUnseen(c) && c.tier <= tierOf(progress, c.topicId)).length;
}

/** Scenario and incident cards (tier 3+) in topics that have reached that tier. */
export function drillSession(cards: ForgeCard[], progress: TopicTier[]): ForgeCard[] {
  const eligible = cards.filter((c) => c.tier >= 3 && tierOf(progress, c.topicId) >= c.tier);
  return sortByPriority(eligible).slice(0, DRILL_PER_SESSION);
}
