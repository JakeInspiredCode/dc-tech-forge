"use client";

import { useState } from "react";
import { topicName, ForgeCard, Quality } from "@/lib/types";
import { useProfile } from "@/lib/convex-hooks";

interface ReviewResult {
  cardId: string;
  quality: Quality;
  responseTime: number;
  topicId: string;
}

interface SessionSummaryProps {
  results: ReviewResult[];
  cards: ForgeCard[];
  duration: number;
  onClose?: () => void;
}

function ReviewCards({ cards }: { cards: ForgeCard[] }) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3 text-v2-danger">
        Needs Review ({cards.length}) <span className="font-normal text-v2-text-muted">— click to flip</span>
      </h3>
      <div className="space-y-2">
        {cards.map((card) => {
          const isFlipped = flipped.has(card.id);
          return (
            <button
              key={card.id}
              onClick={() => toggle(card.id)}
              className={`w-full text-left rounded-lg p-3 text-sm transition-all duration-150 cursor-pointer ${
                isFlipped
                  ? "bg-v2-cyan/5 border border-v2-cyan/20"
                  : "bg-v2-danger/5 border border-v2-danger/20 hover:border-v2-danger/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {!isFlipped && (
                    <p className="text-v2-text">{card.front}</p>
                  )}
                  {isFlipped && (
                    <>
                      <p className="text-v2-text-muted text-xs mb-1.5">{card.front}</p>
                      <p className="text-v2-text whitespace-pre-wrap">{card.back}</p>
                      {card.steps && card.steps.length > 0 && (
                        <ol className="list-decimal list-inside text-v2-text-muted text-xs mt-2 space-y-0.5">
                          {card.steps.map((s, i) => <li key={i}>{s}</li>)}
                        </ol>
                      )}
                    </>
                  )}
                </div>
                <span className="text-[10px] mono text-v2-text-muted shrink-0 mt-0.5">
                  {isFlipped ? "▲ front" : "▼ answer"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SessionSummary({ results, cards, duration, onClose }: SessionSummaryProps) {
  const profile = useProfile();
  const correct = results.filter((r) => r.quality >= 3).length;
  const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const cardsById = new Map(cards.map((c) => [c.id, c]));
  const weakCards = results
    .filter((r) => r.quality < 3)
    .map((r) => cardsById.get(r.cardId))
    .filter((c, i, arr): c is ForgeCard => c !== undefined && arr.findIndex((x) => x?.id === c.id) === i);

  const topicBreakdown: Record<string, { total: number; correct: number }> = {};
  results.forEach((r) => {
    if (!topicBreakdown[r.topicId]) topicBreakdown[r.topicId] = { total: 0, correct: 0 };
    topicBreakdown[r.topicId].total++;
    if (r.quality >= 3) topicBreakdown[r.topicId].correct++;
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-8">
        <div className="text-center mb-8">
          <span className="text-3xl mb-2 block">
            {accuracy >= 90 ? "◆" : accuracy >= 70 ? "▲" : "●"}
          </span>
          <h2 className="text-xl font-bold mb-1">Session Complete</h2>
          <p className="text-v2-text-dim text-sm">
            {minutes}m {seconds}s — {results.length} cards reviewed
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-v2-bg-elevated rounded-lg p-4 text-center">
            <span className={`text-2xl font-bold mono ${
              accuracy >= 85 ? "text-v2-success" : accuracy >= 60 ? "text-v2-warning" : "text-v2-danger"
            }`}>{accuracy}%</span>
            <span className="block text-xs text-v2-text-dim mt-1">Accuracy</span>
          </div>
          <div className="bg-v2-bg-elevated rounded-lg p-4 text-center">
            <span className="text-2xl font-bold mono text-v2-cyan">{profile?.totalPoints ?? 0}</span>
            <span className="block text-xs text-v2-text-dim mt-1">Total Points</span>
          </div>
          <div className="bg-v2-bg-elevated rounded-lg p-4 text-center">
            <span className="text-2xl font-bold mono text-v2-warning">{profile?.streak ?? 0}</span>
            <span className="block text-xs text-v2-text-dim mt-1">Day Streak</span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-v2-text-dim">By Topic</h3>
          <div className="space-y-2">
            {Object.entries(topicBreakdown).map(([topicId, data]) => (
              <div key={topicId} className="flex items-center justify-between text-sm">
                <span className="text-v2-text-dim">{topicName(topicId)}</span>
                <span className={`mono ${
                  data.correct / data.total >= 0.85 ? "text-v2-success" :
                  data.correct / data.total >= 0.6 ? "text-v2-warning" : "text-v2-danger"
                }`}>
                  {data.correct}/{data.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        {weakCards.length > 0 && (
          <ReviewCards cards={weakCards} />
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-v2-cyan/20 text-v2-cyan border border-v2-cyan/30 rounded-lg font-medium hover:bg-v2-cyan/30 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
