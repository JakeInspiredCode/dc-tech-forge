"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@/lib/convex-shim";
import { api } from "../convex/_generated/api";
import { ForgeCard, Quality } from "@/lib/types";
import { sm2 } from "@/lib/sm2";
import Flashcard from "./flashcard";
import StepReveal from "./step-reveal";
import SessionSummary from "./session-summary";
import { dispatchMascotEvent, MascotTrigger } from "@/lib/mascot/types";
import { SESSION_KEYS } from "@/lib/storage-keys";
import TierUnlockToast from "./tier-unlock-toast";

interface CardQueueProps {
  cards: ForgeCard[];
  sessionType: "daily-training" | "topic-drill" | "mock-interview";
  onComplete?: () => void;
}

interface ReviewResult {
  cardId: string;
  quality: Quality;
  responseTime: number;
  topicId: string;
}

const CHECKPOINT_KEY = SESSION_KEYS.sessionCheckpoint;

interface Checkpoint {
  sessionType: string;
  cardIds: string[];
  completedCount: number;
  sessionStart: number;
}

function saveCheckpoint(cp: Checkpoint) {
  try { sessionStorage.setItem(CHECKPOINT_KEY, JSON.stringify(cp)); } catch {}
}

function loadCheckpoint(): Checkpoint | null {
  try {
    const raw = sessionStorage.getItem(CHECKPOINT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearCheckpoint() {
  try { sessionStorage.removeItem(CHECKPOINT_KEY); } catch {}
}

export default function CardQueue({ cards, sessionType, onComplete }: CardQueueProps) {
  // Snapshot the card array on mount so Convex reactivity doesn't
  // mutate the deck mid-session (which causes card peek/flash bugs)
  const [deck] = useState<ForgeCard[]>(() => [...cards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [sessionStart] = useState(Date.now());
  const [tierUnlock, setTierUnlock] = useState<{ topicId: string; newTier: number } | null>(null);
  const [showResume, setShowResume] = useState<Checkpoint | null>(null);

  // Check for interrupted session on mount
  useEffect(() => {
    const cp = loadCheckpoint();
    if (cp && cp.sessionType === sessionType && cp.completedCount > 0) {
      // Verify the card IDs match (same session)
      const currentIds = cards.map((c) => c.id).join(",");
      const savedIds = cp.cardIds.join(",");
      if (currentIds === savedIds && cp.completedCount < cards.length) {
        setShowResume(cp);
        return;
      }
    }
    clearCheckpoint();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateCard = useMutation(api.forgeCards.updateCard);
  const addReview = useMutation(api.forgeReviews.add);
  const addPoints = useMutation(api.forgeProfile.addPoints);
  const recomputeProgress = useMutation(api.forgeProgressRecompute.recompute);
  const addSession = useMutation(api.forgeSessions.add);
  const recordSession = useMutation(api.forgeProfile.recordSessionComplete);
  const checkBadges = useMutation(api.forgeProfile.checkAndAwardBadges);

  const handleRate = useCallback(async (quality: Quality, responseTime: number) => {
    const card = deck[currentIndex];
    if (!card) return;

    // Run SM-2 (pure function — no DB dependency)
    const result = sm2(card, quality, responseTime);
    const today = new Date().toISOString().split("T")[0];

    // Optimistic: advance to next card immediately
    const newResult: ReviewResult = {
      cardId: card.id, quality, responseTime, topicId: card.topicId,
    };
    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    // Mascot trigger on card review
    const triggerMap: Record<number, MascotTrigger> = {
      0: "card-again", 1: "card-again", 2: "card-hard",
      3: "card-good", 4: "card-easy", 5: "card-easy",
    };
    dispatchMascotEvent(triggerMap[quality], { quality, topicId: card.topicId });

    const isLast = currentIndex + 1 >= deck.length;
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    }

    // Fire mutations — only checkpoint after success
    try {
      await updateCard({
        cardId: card.id,
        ...result,
        lastReview: today,
      });
      await addReview({
        cardId: card.id,
        timestamp: new Date().toISOString(),
        quality,
        responseTime,
      });

      // Checkpoint only after critical mutations succeed
      saveCheckpoint({
        sessionType,
        cardIds: deck.map((c) => c.id),
        completedCount: updatedResults.length,
        sessionStart,
      });

      const pts = card.type === "scenario" ? 25 : card.tier === 4 ? 40 : 10;
      await addPoints({ points: pts });
      const progressResult = await recomputeProgress({ topicId: card.topicId });
      if (progressResult && progressResult.currentTier > progressResult.previousTier) {
        setTierUnlock({ topicId: card.topicId, newTier: progressResult.currentTier });
        dispatchMascotEvent("tier-unlocked", { topicId: card.topicId, newTier: progressResult.currentTier });
      }
    } catch (err) {
      console.error("Review mutation error:", err);
    }

    if (isLast) {
      // Session complete — update profile streak + minutes
      const sessionMinutes = Math.round((Date.now() - sessionStart) / 60000);
      try {
        await addSession({
          type: sessionType,
          startTime: new Date(sessionStart).toISOString(),
          endTime: new Date().toISOString(),
          cardIds: deck.map((c) => c.id),
          answers: [],
          overallScore: undefined,
        });
        await recordSession({ sessionMinutes });
        const allGoodOrEasy = updatedResults.every((r) => r.quality >= 3);
        const badgeResult = await checkBadges({ sessionAllGoodOrEasy: allGoodOrEasy });
        if (badgeResult?.awarded) {
          for (const badge of badgeResult.awarded) {
            dispatchMascotEvent("badge-earned", { badge });
            if (badge === "streak-3") dispatchMascotEvent("streak-3");
            if (badge === "streak-7") dispatchMascotEvent("streak-7");
          }
        }
        dispatchMascotEvent("session-complete", { cardCount: deck.length });
        clearCheckpoint();
      } catch (err) {
        console.error("Session save error:", err);
      }
      setFinished(true);
    }
  }, [deck, currentIndex, results, sessionStart, sessionType,
      updateCard, addReview, addPoints, recomputeProgress, addSession, recordSession, checkBadges]);

  if (finished) {
    return (
      <SessionSummary
        results={results}
        cards={deck}
        duration={Math.round((Date.now() - sessionStart) / 1000)}
        onClose={onComplete}
      />
    );
  }

  if (showResume) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <span className="text-4xl mb-4 block">&#x21bb;</span>
        <h2 className="text-xl font-semibold mb-2">Resume Session?</h2>
        <p className="text-forge-text-dim text-sm mb-6">
          You completed {showResume.completedCount} of {deck.length} cards before leaving.
          Those cards were already saved — pick up where you left off?
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setCurrentIndex(showResume.completedCount);
              setShowResume(null);
            }}
            className="px-6 py-3 bg-forge-accent text-white rounded-xl font-medium hover:bg-forge-accent/90 transition-colors"
          >
            Resume ({deck.length - showResume.completedCount} remaining)
          </button>
          <button
            onClick={() => {
              clearCheckpoint();
              setShowResume(null);
            }}
            className="px-6 py-3 bg-forge-surface border border-forge-border rounded-xl font-medium hover:border-forge-border-hover transition-colors"
          >
            Start Fresh
          </button>
        </div>
      </div>
    );
  }

  if (deck.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-4xl mb-4 block">◇</span>
        <h2 className="text-xl font-semibold mb-2">No cards due</h2>
        <p className="text-forge-text-dim">All caught up. Come back later or study new cards.</p>
      </div>
    );
  }

  const card = deck[currentIndex];

  // Tier 4 branching cards use step-reveal
  if (card.tier === 4 && card.steps && card.steps.length > 0) {
    return (
      <>
        {tierUnlock && (
          <TierUnlockToast topicId={tierUnlock.topicId} newTier={tierUnlock.newTier}
            onDismiss={() => setTierUnlock(null)} />
        )}
        <StepReveal card={card} onRate={handleRate} index={currentIndex} total={deck.length} />
      </>
    );
  }

  return (
    <>
      {tierUnlock && (
        <TierUnlockToast topicId={tierUnlock.topicId} newTier={tierUnlock.newTier}
          onDismiss={() => setTierUnlock(null)} />
      )}
      <Flashcard key={card.id} card={card} onRate={handleRate} index={currentIndex} total={deck.length} />
    </>
  );
}
