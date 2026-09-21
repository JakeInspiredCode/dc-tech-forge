"use client";

import { DiagnosisResult } from "./diagnosis-game";

interface Props {
  result: DiagnosisResult;
  onPlayAgain: () => void;
  onBack: () => void;
}

export default function DiagnosisResults({ result, onPlayAgain, onBack }: Props) {
  const { scenario, stepResults, totalCorrectFirstTry, totalSteps } = result;
  const accuracy = totalSteps > 0 ? Math.round((totalCorrectFirstTry / totalSteps) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mono mb-1">Diagnosis Complete</h2>
      <p className="text-sm text-forge-text-dim mb-6">{scenario.title}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-forge-surface border border-forge-border rounded-xl p-4 text-center">
          <span className={`text-2xl font-bold mono ${accuracy >= 80 ? "text-forge-success" : accuracy >= 50 ? "text-forge-warning" : "text-forge-danger"}`}>
            {accuracy}%
          </span>
          <span className="block text-xs text-forge-text-dim mt-1">First-try accuracy</span>
        </div>
        <div className="bg-forge-surface border border-forge-border rounded-xl p-4 text-center">
          <span className="text-2xl font-bold mono text-forge-accent-text">{totalCorrectFirstTry}/{totalSteps}</span>
          <span className="block text-xs text-forge-text-dim mt-1">Steps correct</span>
        </div>
        <div className="bg-forge-surface border border-forge-border rounded-xl p-4 text-center">
          <span className="text-2xl font-bold mono text-forge-text">
            {stepResults.reduce((s, r) => s + r.attempts, 0)}
          </span>
          <span className="block text-xs text-forge-text-dim mt-1">Total attempts</span>
        </div>
      </div>

      {/* Root cause + resolution */}
      <div className="bg-forge-surface border border-forge-border rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold mb-2">Root Cause</h3>
        <p className="text-sm text-forge-text-dim mb-4">{scenario.rootCause}</p>
        <h3 className="text-sm font-semibold mb-2">Resolution</h3>
        <p className="text-sm text-forge-text-dim">{scenario.resolution}</p>
      </div>

      {/* Step review */}
      <div className="space-y-2 mb-6">
        {stepResults.map((sr, i) => (
          <div key={i} className={`bg-forge-surface border rounded-lg p-3 ${
            sr.correct ? "border-forge-success/20" : "border-forge-warning/20"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-forge-text-dim">Step {i + 1}</span>
              <span className={`text-[10px] mono font-medium ${sr.correct ? "text-forge-success" : "text-forge-warning"}`}>
                {sr.correct ? "First try" : `${sr.attempts} attempts`}
              </span>
            </div>
            <p className="text-xs text-forge-text">{sr.step.prompt}</p>
            <code className="text-[11px] mono text-forge-accent-text mt-1 block">{sr.step.command}</code>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 bg-forge-accent text-white rounded-xl font-medium hover:bg-forge-accent/90 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-forge-surface border border-forge-border text-forge-text-dim rounded-xl font-medium hover:text-forge-text transition-colors"
        >
          Back to Scenarios
        </button>
      </div>
    </div>
  );
}
