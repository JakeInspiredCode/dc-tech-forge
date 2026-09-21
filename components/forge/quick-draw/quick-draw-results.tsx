"use client";

import { QuickDrawSummary, QuickDrawResult } from "./quick-draw-game";

interface Props {
  summary: QuickDrawSummary;
  moduleName: string;
  onPlayAgain: () => void;
  onBack: () => void;
}

export default function QuickDrawResults({ summary, moduleName, onPlayAgain, onBack }: Props) {
  const { results, accuracy, correctCount, totalCount, avgTimeMs, totalTime } = summary;

  const missed = results.filter((r) => !r.correct);
  const slowest = [...results].sort((a, b) => b.timeMs - a.timeMs).slice(0, 5);

  const totalSec = Math.round(totalTime / 1000);
  const avgSec = (avgTimeMs / 1000).toFixed(1);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mono mb-1">Quick Draw Results</h2>
      <p className="text-sm text-v2-text-dim mb-6">{moduleName}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-4 text-center">
          <span className={`text-2xl font-bold mono ${accuracy >= 80 ? "text-v2-success" : accuracy >= 60 ? "text-v2-warning" : "text-v2-danger"}`}>
            {accuracy}%
          </span>
          <span className="block text-xs text-v2-text-dim mt-1">Accuracy</span>
        </div>
        <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-4 text-center">
          <span className="text-2xl font-bold mono text-v2-cyan">{correctCount}/{totalCount}</span>
          <span className="block text-xs text-v2-text-dim mt-1">Correct</span>
        </div>
        <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-4 text-center">
          <span className="text-2xl font-bold mono text-v2-text">{avgSec}s</span>
          <span className="block text-xs text-v2-text-dim mt-1">Avg Time</span>
        </div>
        <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-4 text-center">
          <span className="text-2xl font-bold mono text-v2-text">{totalSec}s</span>
          <span className="block text-xs text-v2-text-dim mt-1">Total</span>
        </div>
      </div>

      {/* Missed items */}
      {missed.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-v2-danger">Missed ({missed.length})</h3>
          <div className="space-y-2">
            {missed.map((r, i) => (
              <MissedCard key={i} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* Slowest answers */}
      {slowest.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-v2-warning">Slowest Answers</h3>
          <div className="space-y-1">
            {slowest.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-v2-bg-surface rounded-lg text-xs">
                <span className="mono text-v2-text-dim">{r.item.prompt}</span>
                <span className="mono text-v2-warning">{(r.timeMs / 1000).toFixed(1)}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 bg-v2-cyan text-v2-bg-deep rounded-xl font-medium hover:bg-v2-cyan-bright transition-colors"
        >
          Play Again
        </button>
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-v2-bg-surface border border-v2-border text-v2-text-dim rounded-xl font-medium hover:text-v2-text transition-colors"
        >
          Back to Modules
        </button>
      </div>
    </div>
  );
}

function MissedCard({ result }: { result: QuickDrawResult }) {
  return (
    <div className="bg-v2-bg-surface border border-v2-danger/20 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-v2-text-dim">{result.item.prompt}</p>
          <p className="text-sm mono text-v2-success mt-1">{result.item.answer}</p>
        </div>
        <div className="text-right shrink-0">
          {result.userAnswer && (
            <p className="text-xs mono text-v2-danger line-through">{result.userAnswer}</p>
          )}
          <p className="text-[10px] text-v2-text-muted">{(result.timeMs / 1000).toFixed(1)}s</p>
        </div>
      </div>
    </div>
  );
}
