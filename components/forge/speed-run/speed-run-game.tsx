"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ForgeCard } from "@/lib/types";
import {
  evaluate,
  EvalScore,
  calcPoints,
  getComboMultiplier,
  getTimeAdjustment,
  scoreToSM2Quality,
} from "@/lib/forge/evaluator";
import SpeedRunHud from "./speed-run-hud";
import SpeedRunInput from "./speed-run-input";
import SpeedRunFeedback from "./speed-run-feedback";
import SelfGradePrompt from "./self-grade-prompt";

export interface CardResult {
  cardId: string;
  result: EvalScore;
  userInput: string;
  responseMs: number;
  feedback: string;
}

export interface SpeedRunSummary {
  totalPoints: number;
  correctCards: number;
  partialCards: number;
  wrongCards: number;
  bestStreak: number;
  avgResponseMs: number;
  cardResults: CardResult[];
  totalCards: number;
}

interface SpeedRunGameProps {
  cards: ForgeCard[];
  startingTime: number; // seconds
  onComplete: (summary: SpeedRunSummary) => void;
  onExit: () => void;
  onReviewCard?: (cardId: string, quality: number, responseMs: number) => void;
}

type Phase = "playing" | "feedback" | "self-grade" | "done";

export default function SpeedRunGame({
  cards,
  startingTime,
  onComplete,
  onExit,
  onReviewCard,
}: SpeedRunGameProps) {
  const [timeLeft, setTimeLeft] = useState(startingTime);
  const [cardIndex, setCardIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [results, setResults] = useState<CardResult[]>([]);
  const [lastEval, setLastEval] = useState<{
    score: EvalScore; points: number; timeAdj: number; feedback: string; userInput: string;
  } | null>(null);

  const cardStartTime = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunning = useRef(false);

  const currentCard = cards[cardIndex];

  // ── Timer ──
  useEffect(() => {
    if (phase !== "playing") return;
    isRunning.current = true;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          isRunning.current = false;
          setPhase("done");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Reset card timer on new card
  useEffect(() => {
    cardStartTime.current = Date.now();
  }, [cardIndex]);

  // Trigger completion when done
  useEffect(() => {
    if (phase === "done") {
      const correct = results.filter((r) => r.result === "correct").length;
      const partial = results.filter((r) => r.result === "partial").length;
      const wrong = results.filter((r) => r.result === "wrong").length;
      const avgMs = results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.responseMs, 0) / results.length)
        : 0;

      // Bonus points
      let bonusPoints = 0;
      if (results.length >= 50) bonusPoints += 50;
      const acc = results.length > 0 ? correct / results.length : 0;
      if (acc >= 0.9) bonusPoints += 25;
      if (bestStreak >= 10) bonusPoints += 25;

      onComplete({
        totalPoints: points + bonusPoints,
        correctCards: correct,
        partialCards: partial,
        wrongCards: wrong,
        bestStreak,
        avgResponseMs: avgMs,
        cardResults: results,
        totalCards: results.length,
      });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback((userInput: string) => {
    if (phase !== "playing" || !currentCard) return;

    const responseMs = Date.now() - cardStartTime.current;
    const evalResult = evaluate(userInput, currentCard);

    if (evalResult.needsSelfGrade) {
      // Pause timer and show self-grade
      if (timerRef.current) clearInterval(timerRef.current);
      setLastEval({ score: "wrong", points: 0, timeAdj: 0, feedback: "", userInput });
      setPhase("self-grade");
      return;
    }

    applyResult(evalResult.score, userInput, responseMs, evalResult.feedback, currentCard);
  }, [phase, currentCard, streak]);

  const handleSelfGrade = useCallback((score: EvalScore) => {
    if (!currentCard || !lastEval) return;
    const responseMs = Date.now() - cardStartTime.current;
    applyResult(score, lastEval.userInput, responseMs, "Self-graded", currentCard);
  }, [currentCard, lastEval, streak]);

  const applyResult = (
    score: EvalScore,
    userInput: string,
    responseMs: number,
    feedback: string,
    card: ForgeCard,
  ) => {
    const multiplier = getComboMultiplier(streak);
    const earned = calcPoints(score, card.tier, multiplier);
    const timeAdj = getTimeAdjustment(score, streak);
    const newStreak = score === "correct" ? streak + 1 : score === "wrong" ? 0 : streak;

    setPoints((p) => p + earned);
    setStreak(newStreak);
    setBestStreak((b) => Math.max(b, newStreak));
    setTimeLeft((t) => Math.max(0, t + timeAdj));

    const result: CardResult = { cardId: card.id, result: score, userInput, responseMs, feedback };
    setResults((r) => [...r, result]);
    setLastEval({ score, points: earned, timeAdj, feedback, userInput });

    // Fire SM-2 review
    onReviewCard?.(card.id, scoreToSM2Quality(score), responseMs);

    setPhase("feedback");
  };

  const handleFeedbackDone = useCallback(() => {
    const nextIndex = cardIndex + 1;
    if (nextIndex >= cards.length || timeLeft <= 0) {
      setPhase("done");
      return;
    }
    setCardIndex(nextIndex);
    setPhase("playing");
  }, [cardIndex, cards.length, timeLeft]);

  const handleOverride = useCallback((newScore: EvalScore) => {
    if (!lastEval || !currentCard) return;
    // Undo old score effects and apply new score
    const oldScore = lastEval.score;
    const oldMultiplier = getComboMultiplier(oldScore === "correct" ? streak - 1 : streak);
    const oldPoints = lastEval.points;
    const oldTimeAdj = lastEval.timeAdj;

    const newMultiplier = getComboMultiplier(streak);
    const newPoints = calcPoints(newScore, currentCard.tier, newMultiplier);
    const newTimeAdj = getTimeAdjustment(newScore, streak);

    // Adjust points: remove old, add new
    setPoints((p) => p - oldPoints + newPoints);
    // Adjust time: remove old adj, add new adj
    setTimeLeft((t) => Math.max(0, t - oldTimeAdj + newTimeAdj));
    // Fix streak
    if (newScore === "correct" && oldScore !== "correct") {
      setStreak((s) => s + 1);
      setBestStreak((b) => Math.max(b, streak + 1));
    }

    // Update last result
    setResults((r) => {
      const updated = [...r];
      if (updated.length > 0) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], result: newScore };
      }
      return updated;
    });
    setLastEval({ ...lastEval, score: newScore, points: newPoints, timeAdj: newTimeAdj });

    // Re-fire SM-2 with corrected quality
    onReviewCard?.(currentCard.id, scoreToSM2Quality(newScore), 0);

    // Auto-advance after brief delay
    setTimeout(handleFeedbackDone, 500);
  }, [lastEval, currentCard, streak, handleFeedbackDone, onReviewCard]);

  if (!currentCard && phase !== "done") return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <SpeedRunHud
        timeLeft={timeLeft}
        startingTime={startingTime}
        streak={streak}
        points={points}
        cardIndex={cardIndex}
        totalCards={cards.length}
        correctCount={results.filter((r) => r.result === "correct").length}
      />

      {/* Progress bar */}
      <div className="h-1 bg-v2-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-v2-cyan rounded-full transition-all duration-300"
          style={{ width: `${(cardIndex / cards.length) * 100}%` }}
        />
      </div>

      {phase === "self-grade" && currentCard && lastEval ? (
        <SelfGradePrompt
          expectedAnswer={currentCard.back}
          userInput={lastEval.userInput}
          onGrade={handleSelfGrade}
        />
      ) : phase === "feedback" && lastEval ? (
        <>
          <SpeedRunFeedback
            score={lastEval.score}
            points={lastEval.points}
            timeAdjustment={lastEval.timeAdj}
            feedback={lastEval.feedback}
            expectedAnswer={lastEval.score !== "correct" ? currentCard?.back : undefined}
            onDone={handleFeedbackDone}
            onOverride={handleOverride}
          />
          {/* Keep card visible during feedback */}
          {currentCard && (
            <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-6 min-h-[80px] flex items-center justify-center opacity-70">
              <div className="text-sm text-v2-text-dim text-center mono">
                {currentCard.front.slice(0, 100)}
              </div>
            </div>
          )}
        </>
      ) : currentCard ? (
        <SpeedRunInput
          card={currentCard}
          onSubmit={handleSubmit}
          disabled={phase !== "playing"}
        />
      ) : null}

      <button
        onClick={onExit}
        className="text-xs text-v2-text-muted hover:text-v2-text-dim transition-colors mono"
      >
        ← exit speed run
      </button>
    </div>
  );
}
