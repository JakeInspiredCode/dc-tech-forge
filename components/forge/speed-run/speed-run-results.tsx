"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SpeedRunSummary } from "./speed-run-game";
import { ForgeCard } from "@/lib/types";
import { onActivate } from "@/lib/a11y";

interface HighScore {
  totalPoints: number;
  timestamp: string;
  totalCards: number;
  correctCards: number;
}

interface SpeedRunResultsProps {
  summary: SpeedRunSummary;
  cards: ForgeCard[];
  highScores: HighScore[];
  onReviewMisses: (cards: ForgeCard[]) => void;
  onPlayAgain: () => void;
  onDashboard: () => void;
}

export default function SpeedRunResults({
  summary,
  cards,
  highScores,
  onReviewMisses,
  onPlayAgain,
  onDashboard,
}: SpeedRunResultsProps) {
  const [missesExpanded, setMissesExpanded] = useState(false);
  const [overrides, setOverrides] = useState<Set<string>>(new Set());
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const overrideCount = overrides.size;
  const effectiveCorrect = summary.correctCards + overrideCount;

  const accuracy = summary.totalCards > 0
    ? Math.round((effectiveCorrect / summary.totalCards) * 100)
    : 0;

  const avgSecs = (summary.avgResponseMs / 1000).toFixed(1);

  const cardsById = new Map(cards.map((c) => [c.id, c]));

  const missedResults = summary.cardResults.filter((r) => r.result !== "correct" && !overrides.has(r.cardId));
  const missedCards = missedResults
    .map((r) => cardsById.get(r.cardId))
    .filter(Boolean) as ForgeCard[];

  // Check if this is a new high score
  const prevBest = highScores[0]?.totalPoints ?? 0;
  const isNewBest = summary.totalPoints > prevBest;

  // Tier breakdown
  const tierBreakdown: Record<number, { correct: number; total: number }> = {};
  summary.cardResults.forEach((r) => {
    const card = cardsById.get(r.cardId);
    if (!card) return;
    if (!tierBreakdown[card.tier]) tierBreakdown[card.tier] = { correct: 0, total: 0 };
    tierBreakdown[card.tier].total++;
    if (r.result === "correct" || overrides.has(r.cardId)) tierBreakdown[card.tier].correct++;
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-6 text-center">
        <p className="text-xs mono text-v2-text-dim mb-2 tracking-widest uppercase">Speed Run Complete</p>
        {isNewBest && (
          <p className="text-xs mono text-v2-warning mb-2">🏆 New High Score!</p>
        )}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-3xl font-bold mono text-v2-cyan">⚡ {summary.totalPoints}</span>
          <span className="text-v2-text-dim">pts</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat label="Cards" value={summary.totalCards.toString()} />
          <Stat label="Correct" value={`${effectiveCorrect} (${accuracy}%)`} color={accuracy >= 80 ? "text-v2-success" : accuracy >= 60 ? "text-v2-warning" : "text-v2-danger"} />
          <Stat label="Best Streak" value={`🔥 ${summary.bestStreak}`} />
          <Stat label="Avg Response" value={`${avgSecs}s`} />
        </div>

        {/* Tier breakdown */}
        {Object.keys(tierBreakdown).length > 0 && (
          <div className="mt-4 pt-4 border-t border-v2-border flex items-center justify-center gap-4 text-xs mono text-v2-text-dim">
            {Object.entries(tierBreakdown)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([tier, { correct, total }]) => (
                <span key={tier}>
                  T{tier}: <span className="text-v2-text">{correct}/{total}</span>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Missed cards */}
      {missedResults.length > 0 && (
        <div className="bg-v2-bg-surface border border-v2-border rounded-xl overflow-hidden">
          <button
            onClick={() => setMissesExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm text-v2-text-dim hover:text-v2-text transition-colors"
          >
            <span className="mono">▸ Missed Cards ({missedResults.length})</span>
            <span className="text-xs">{missesExpanded ? "▲" : "▼"}</span>
          </button>

          {missesExpanded && (
            <div className="border-t border-v2-border divide-y divide-v2-border/50 max-h-[240px] overflow-y-auto">
              {missedResults.map((r) => {
                const card = cardsById.get(r.cardId);
                if (!card) return null;
                const isExpanded = expandedCardId === r.cardId;
                return (
                  <div key={r.cardId} className="px-5 py-2.5">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      className="flex items-start justify-between gap-2 cursor-pointer group"
                      onClick={() => setExpandedCardId(isExpanded ? null : r.cardId)}
                      onKeyDown={onActivate(() => setExpandedCardId(isExpanded ? null : r.cardId))}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-v2-text truncate group-hover:text-v2-cyan transition-colors">
                          {card.front.slice(0, 80)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] mono ${r.result === "partial" ? "text-v2-warning" : "text-v2-danger"}`}>
                          {r.result}
                        </span>
                        <span className="text-[10px] text-v2-text-muted">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-[10px] mono text-v2-text-muted mb-1">Your answer:</p>
                          <p className="text-xs mono text-v2-text-dim bg-v2-bg-elevated px-2.5 py-1.5 rounded border border-v2-border/50">
                            {r.userInput || <span className="italic text-v2-text-muted">no answer</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] mono text-v2-text-muted mb-1">Expected:</p>
                          <div className="text-xs bg-v2-bg-elevated px-2.5 py-1.5 rounded border border-v2-cyan/20 markdown-content max-h-[160px] overflow-y-auto">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.back}</ReactMarkdown>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOverrides((prev) => new Set(prev).add(r.cardId));
                            setExpandedCardId(null);
                          }}
                          className="w-full py-1.5 rounded-lg border text-[11px] font-medium mono transition-colors
                            bg-v2-success/10 text-v2-success/70 border-v2-success/20
                            hover:bg-v2-success/20 hover:text-v2-success"
                        >
                          Actually correct
                        </button>
                      </div>
                    )}

                    {!isExpanded && (
                      <p className="text-[11px] mono text-v2-text-muted mt-0.5">
                        you: <span className="text-v2-text-dim">{r.userInput.slice(0, 60) || "—"}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {missedCards.length > 0 && (
          <button
            onClick={() => onReviewMisses(missedCards)}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors
              bg-v2-warning/15 text-v2-warning border-v2-warning/30 hover:bg-v2-warning/25"
          >
            Review Misses
          </button>
        )}
        <button
          onClick={onPlayAgain}
          className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors
            bg-v2-cyan/15 text-v2-cyan border-v2-cyan/30 hover:bg-v2-cyan/25"
        >
          Play Again
        </button>
        <button
          onClick={onDashboard}
          className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors
            bg-v2-bg-surface text-v2-text-dim border-v2-border hover:bg-v2-bg-elevated"
        >
          Back to Arsenal
        </button>
      </div>

      {/* High scores */}
      {highScores.length > 0 && (
        <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-4">
          <p className="text-xs mono text-v2-text-dim mb-3 tracking-widest uppercase">High Scores</p>
          <div className="space-y-1.5">
            {highScores.slice(0, 5).map((hs, i) => {
              const isNew = isNewBest && i === 0 && hs.totalPoints === summary.totalPoints;
              const acc = hs.totalCards > 0 ? Math.round((hs.correctCards / hs.totalCards) * 100) : 0;
              const date = new Date(hs.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div key={i} className={`flex items-center gap-3 text-xs mono ${isNew ? "text-v2-cyan" : "text-v2-text-dim"}`}>
                  <span className="w-4 text-right text-v2-text-muted">{i + 1}.</span>
                  <span className="font-bold text-v2-text">{hs.totalPoints} pts</span>
                  <span>{date}</span>
                  <span>({hs.totalCards} cards, {acc}%)</span>
                  {isNew && <span className="text-v2-warning">← NEW</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className={`text-base font-bold mono ${color ?? "text-v2-text"}`}>{value}</p>
      <p className="text-xs text-v2-text-dim">{label}</p>
    </div>
  );
}
