"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import SpeedRunGame, { SpeedRunSummary, CardResult } from "@/components/forge/speed-run/speed-run-game";
import SpeedRunResults from "@/components/forge/speed-run/speed-run-results";
import CardQueue from "@/components/card-queue";
import { ForgeCard, TOPICS, TopicId } from "@/lib/types";
import {
  useCards,
  useAllProgress,
  useAddReview,
  useUpdateCard,
  useAddPoints,
  useCheckBadges,
} from "@/lib/convex-hooks";
import { useSpeedRunAdd, useSpeedRunHistory } from "@/lib/convex-hooks";
import { sm2 } from "@/lib/sm2";
import { dispatchMascotEvent } from "@/lib/mascot/types";

type CardTypeFilter = "easy" | "intermediate" | "scenario";
type TimerOption = 45 | 60 | 90;

type Screen = "setup" | "playing" | "results" | "review-misses";

// Weighted random card selection
function buildCardQueue(
  rawCards: ReturnType<typeof useCards>,
  topicId: string,
  typeFilter: CardTypeFilter[],
  progress: ReturnType<typeof useAllProgress>,
): ForgeCard[] {
  const today = new Date().toISOString().split("T")[0];

  // Get unlocked tiers per topic
  const unlockedTiers: Record<string, number> = {};
  for (const p of progress) {
    unlockedTiers[p.topicId] = p.currentTier;
  }

  const eligible = rawCards.filter((c) => {
    if (topicId !== "mixed" && c.topicId !== topicId) return false;
    if (!typeFilter.includes(c.type as CardTypeFilter)) return false;
    if (c.tier === 4) return false; // Exclude Tier 4 branching cards
    const maxTier = unlockedTiers[c.topicId] ?? 1;
    if (c.tier > maxTier) return false;
    return true;
  });

  if (eligible.length === 0) return [];

  // Weight: due cards 3x, weak cards 2x, others 1x
  const weighted: typeof rawCards = [];
  for (const c of eligible) {
    const isDue = c.dueDate <= today;
    const isWeak = c.easeFactor < 2.0;
    const weight = isDue ? 3 : isWeak ? 2 : 1;
    for (let i = 0; i < weight; i++) weighted.push(c);
  }

  // Shuffle
  for (let i = weighted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weighted[i], weighted[j]] = [weighted[j], weighted[i]];
  }

  // Deduplicate and cap at 50
  const seen = new Set<string>();
  const queue: ForgeCard[] = [];
  for (const c of weighted) {
    if (!seen.has(c.cardId) && queue.length < 50) {
      seen.add(c.cardId);
      queue.push({
        id: c.cardId,
        topicId: c.topicId as TopicId,
        type: c.type as ForgeCard["type"],
        front: c.front,
        back: c.back,
        difficulty: c.difficulty as ForgeCard["difficulty"],
        tier: c.tier as ForgeCard["tier"],
        steps: c.steps,
        easeFactor: c.easeFactor,
        interval: c.interval,
        repetitions: c.repetitions,
        dueDate: c.dueDate,
        lastReview: c.lastReview ?? null,
      });
    }
  }

  return queue;
}

export default function SpeedRunPage() {
  const router = useRouter();
  const rawCards = useCards();
  const progress = useAllProgress();
  const addReview = useAddReview();
  const updateCard = useUpdateCard();
  const addPoints = useAddPoints();
  const checkBadges = useCheckBadges();
  const addSpeedRun = useSpeedRunAdd();
  const highScores = useSpeedRunHistory();

  const [screen, setScreen] = useState<Screen>("setup");
  const [topicId, setTopicId] = useState<string>("mixed");
  const [typeFilter, setTypeFilter] = useState<CardTypeFilter[]>(["easy", "intermediate", "scenario"]);
  const [timerOption, setTimerOption] = useState<TimerOption>(60);
  const [gameCards, setGameCards] = useState<ForgeCard[]>([]);
  const [summary, setSummary] = useState<SpeedRunSummary | null>(null);

  // Count eligible cards for warning
  const eligibleCount = useMemo(() => {
    if (rawCards.length === 0) return 0;
    const today = new Date().toISOString().split("T")[0];
    const unlockedTiers: Record<string, number> = {};
    for (const p of progress) unlockedTiers[p.topicId] = p.currentTier;
    return rawCards.filter((c) => {
      if (topicId !== "mixed" && c.topicId !== topicId) return false;
      if (!typeFilter.includes(c.type as CardTypeFilter)) return false;
      if (c.tier === 4) return false;
      const maxTier = unlockedTiers[c.topicId] ?? 1;
      return c.tier <= maxTier;
    }).length;
  }, [rawCards, progress, topicId, typeFilter]);

  const toggleType = (t: CardTypeFilter) => {
    setTypeFilter((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleStart = () => {
    const queue = buildCardQueue(rawCards, topicId, typeFilter, progress);
    setGameCards(queue);
    setScreen("playing");
  };

  const handleReviewCard = async (cardId: string, quality: number, responseMs: number) => {
    const raw = rawCards.find((c) => c.cardId === cardId);
    if (!raw) return;
    const updated = sm2(
      { easeFactor: raw.easeFactor, interval: raw.interval, repetitions: raw.repetitions },
      quality as 0 | 1 | 2 | 3 | 4 | 5,
      responseMs,
    );
    await updateCard({
      cardId,
      easeFactor: updated.easeFactor,
      interval: updated.interval,
      repetitions: updated.repetitions,
      dueDate: updated.dueDate,
      lastReview: new Date().toISOString(),
    });
    await addReview({
      cardId,
      timestamp: new Date().toISOString(),
      quality,
      responseTime: responseMs,
    });
  };

  const handleComplete = async (s: SpeedRunSummary) => {
    setSummary(s);

    // Persist speed run record
    await addSpeedRun({
      timestamp: new Date().toISOString(),
      topicId,
      cardTypeFilter: typeFilter,
      startingTime: timerOption,
      totalCards: s.totalCards,
      correctCards: s.correctCards,
      partialCards: s.partialCards,
      wrongCards: s.wrongCards,
      totalPoints: s.totalPoints,
      bestStreak: s.bestStreak,
      avgResponseMs: s.avgResponseMs,
      cardResults: s.cardResults.map((r: CardResult) => ({
        cardId: r.cardId,
        result: r.result,
        userInput: r.userInput,
        responseMs: r.responseMs,
        feedback: r.feedback,
      })),
    });

    // Add points to profile
    if (s.totalPoints > 0) {
      await addPoints({ points: s.totalPoints });
    }

    const accuracy = s.totalCards > 0 ? Math.round((s.correctCards / s.totalCards) * 100) : 0;
    dispatchMascotEvent("speed-run-complete", { accuracy, totalCards: s.totalCards, bestStreak: s.bestStreak });

    // Check for new badges
    try {
      const badgeResult = await checkBadges({
        speedRunBestStreak: s.bestStreak,
        speedRunCorrect: s.correctCards,
        speedRunTotal: s.totalCards,
      });
      if (badgeResult?.awarded) {
        for (const badge of badgeResult.awarded) {
          dispatchMascotEvent("badge-earned", { badge });
        }
      }
    } catch (e) {
      console.error("Badge check error:", e);
    }

    setScreen("results");
  };

  const [reviewCards, setReviewCards] = useState<ForgeCard[]>([]);

  const handleReviewMisses = (missedCards: ForgeCard[]) => {
    setReviewCards(missedCards);
    setScreen("review-misses");
  };

  if (screen === "playing") {
    return (
      <div className="min-h-screen bg-v2-bg-deep">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <SpeedRunGame
            cards={gameCards}
            startingTime={timerOption}
            onComplete={handleComplete}
            onExit={() => setScreen("setup")}
            onReviewCard={handleReviewCard}
          />
        </div>
      </div>
    );
  }

  if (screen === "review-misses" && reviewCards.length > 0) {
    return (
      <div className="min-h-screen bg-v2-bg-deep">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mono">Miss Review</h2>
              <p className="text-sm text-forge-text-dim">{reviewCards.length} cards — no time limit</p>
            </div>
            <button
              onClick={() => setScreen("results")}
              className="text-sm text-forge-text-dim hover:text-forge-text mono transition-colors"
            >
              ← back to results
            </button>
          </div>
          <CardQueue
            cards={reviewCards}
            sessionType="topic-drill"
            onComplete={() => setScreen("results")}
          />
        </div>
      </div>
    );
  }

  if (screen === "results" && summary) {
    return (
      <div className="min-h-screen bg-v2-bg-deep">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <SpeedRunResults
            summary={summary}
            cards={gameCards}
            highScores={highScores}
            onReviewMisses={handleReviewMisses}
            onPlayAgain={() => { handleStart(); }}
            onDashboard={() => router.push("/arsenal")}
          />
        </div>
      </div>
    );
  }

  // Setup screen
  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold mono mb-1">⚡ Speed Run</h1>
          <p className="text-sm text-forge-text-dim">
            Type your answers against the clock. Every card counts toward your SM-2 progress.
          </p>
        </div>

        {/* Topic */}
        <Section label="Topic">
          <select aria-label="Topic"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full bg-forge-surface border border-forge-border rounded-lg px-3 py-2 text-sm text-forge-text mono outline-none focus:border-forge-accent/50"
          >
            <option value="mixed">Mixed — All Topics</option>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Section>

        {/* Card types */}
        <Section label="Card Types">
          <div className="flex gap-2">
            {(["easy", "intermediate", "scenario"] as CardTypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium mono transition-colors capitalize ${
                  typeFilter.includes(t)
                    ? "bg-forge-accent/20 text-forge-accent-text border-forge-accent/40"
                    : "bg-forge-surface text-forge-text-dim border-forge-border hover:border-forge-border-hover"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {eligibleCount < 10 && typeFilter.length > 0 && (
            <p className="text-xs text-forge-warning mt-2 mono">
              ⚠ Only {eligibleCount} cards match these filters. Broaden your selection.
            </p>
          )}
        </Section>

        {/* Timer */}
        <Section label="Starting Time">
          <div className="flex gap-2">
            {([45, 60, 90] as TimerOption[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimerOption(t)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium mono transition-colors ${
                  timerOption === t
                    ? "bg-forge-accent/20 text-forge-accent-text border-forge-accent/40"
                    : "bg-forge-surface text-forge-text-dim border-forge-border hover:border-forge-border-hover"
                }`}
              >
                {t}s
                <span className="block text-[10px] opacity-80">
                  {t === 45 ? "hard" : t === 60 ? "default" : "practice"}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* Start */}
        <button
          onClick={handleStart}
          disabled={eligibleCount < 3 || typeFilter.length === 0}
          className="w-full py-3 rounded-xl text-sm font-bold mono transition-colors
            bg-forge-accent text-white hover:bg-forge-accent/90
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Speed Run →
        </button>

        <p className="text-xs text-forge-text-muted text-center mono">
          {eligibleCount} eligible cards loaded
        </p>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs mono text-forge-text-dim mb-2 uppercase tracking-widest">{label}</p>
      {children}
    </div>
  );
}
