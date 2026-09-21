"use client";

import { getComboMultiplier } from "@/lib/forge/evaluator";

interface SpeedRunHudProps {
  timeLeft: number;
  startingTime: number;
  streak: number;
  points: number;
  cardIndex: number;
  totalCards: number;
  correctCount: number;
}

export default function SpeedRunHud({
  timeLeft,
  startingTime,
  streak,
  points,
  cardIndex,
  totalCards,
  correctCount,
}: SpeedRunHudProps) {
  const multiplier = getComboMultiplier(streak);
  const isLow = timeLeft <= 10;
  const isCritical = timeLeft <= 5;
  const accuracy = cardIndex > 0 ? Math.round((correctCount / cardIndex) * 100) : 0;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = mins > 0
    ? `${mins}:${secs.toString().padStart(2, "0")}`
    : `${secs}s`;

  const timerBg = isCritical
    ? "bg-v2-danger/20 border-v2-danger/50"
    : isLow
    ? "bg-v2-warning/20 border-v2-warning/40"
    : "bg-v2-bg-surface border-v2-border";

  const timerText = isCritical
    ? "text-v2-danger"
    : isLow
    ? "text-v2-warning"
    : "text-v2-text";

  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Timer */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${timerBg}`}>
        <span className="text-xs text-v2-text-dim">⏱</span>
        <span className={`mono font-bold text-lg tabular-nums ${timerText} ${isCritical ? "animate-pulse" : ""}`}>
          {timeStr}
        </span>
      </div>

      {/* Combo */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-v2-bg-surface border-v2-border">
        <span className="text-xs text-v2-text-dim">COMBO</span>
        <span
          className={`mono font-bold tabular-nums transition-all ${
            streak >= 10 ? "text-v2-danger text-lg" :
            streak >= 6  ? "text-v2-warning text-base" :
            streak >= 3  ? "text-v2-cyan text-sm" :
            "text-v2-text-dim text-sm"
          }`}
        >
          {streak}
        </span>
        <span className={`mono text-xs font-medium ${multiplier > 1 ? "text-v2-cyan" : "text-v2-text-muted"}`}>
          {multiplier > 1 ? `(${multiplier}x)` : ""}
        </span>
      </div>

      {/* Points */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-v2-bg-surface border-v2-border">
        <span className="text-xs">⚡</span>
        <span className="mono font-bold text-v2-cyan tabular-nums">{points}</span>
      </div>

      <div className="flex-1" />

      {/* Progress + accuracy */}
      <div className="flex items-center gap-3 text-xs text-v2-text-dim mono">
        <span>{cardIndex}/{totalCards}</span>
        {cardIndex > 0 && (
          <span className={accuracy >= 80 ? "text-v2-success" : accuracy >= 60 ? "text-v2-warning" : "text-v2-danger"}>
            {accuracy}% acc
          </span>
        )}
      </div>
    </div>
  );
}
