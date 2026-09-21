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
    ? "bg-forge-danger/20 border-forge-danger/50"
    : isLow
    ? "bg-forge-warning/20 border-forge-warning/40"
    : "bg-forge-surface border-forge-border";

  const timerText = isCritical
    ? "text-forge-danger"
    : isLow
    ? "text-forge-warning"
    : "text-forge-text";

  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Timer */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${timerBg}`}>
        <span className="text-xs text-forge-text-dim">⏱</span>
        <span className={`mono font-bold text-lg tabular-nums ${timerText} ${isCritical ? "animate-pulse" : ""}`}>
          {timeStr}
        </span>
      </div>

      {/* Combo */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-forge-surface border-forge-border">
        <span className="text-xs text-forge-text-dim">COMBO</span>
        <span
          className={`mono font-bold tabular-nums transition-all ${
            streak >= 10 ? "text-forge-danger text-lg" :
            streak >= 6  ? "text-forge-warning text-base" :
            streak >= 3  ? "text-forge-accent-text text-sm" :
            "text-forge-text-dim text-sm"
          }`}
        >
          {streak}
        </span>
        <span className={`mono text-xs font-medium ${multiplier > 1 ? "text-forge-accent-text" : "text-forge-text-muted"}`}>
          {multiplier > 1 ? `(${multiplier}x)` : ""}
        </span>
      </div>

      {/* Points */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-forge-surface border-forge-border">
        <span className="text-xs">⚡</span>
        <span className="mono font-bold text-forge-accent-text tabular-nums">{points}</span>
      </div>

      <div className="flex-1" />

      {/* Progress + accuracy */}
      <div className="flex items-center gap-3 text-xs text-forge-text-dim mono">
        <span>{cardIndex}/{totalCards}</span>
        {cardIndex > 0 && (
          <span className={accuracy >= 80 ? "text-forge-success" : accuracy >= 60 ? "text-forge-warning" : "text-forge-danger"}>
            {accuracy}% acc
          </span>
        )}
      </div>
    </div>
  );
}
