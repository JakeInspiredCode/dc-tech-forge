"use client";

import { useState, useCallback } from "react";
import { TRIAGE_SCENARIOS, type TriageScenario, type TriageStep } from "@/lib/seeds/boot-process-data";

type GamePhase = "select" | "playing" | "results";

interface StepResult {
  step: TriageStep;
  correct: boolean;
  attempts: number;
}

interface ScenarioResult {
  scenario: TriageScenario;
  stepResults: StepResult[];
  firstTryCount: number;
}

export default function BootTriage({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<GamePhase>("select");
  const [activeScenario, setActiveScenario] = useState<TriageScenario | null>(null);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const startScenario = (scenario: TriageScenario) => {
    setActiveScenario(scenario);
    setResult(null);
    setPhase("playing");
  };

  const handleComplete = (res: ScenarioResult) => {
    setResult(res);
    setCompletedIds((prev) => new Set(prev).add(res.scenario.id));
    setPhase("results");
  };

  const backToSelect = () => {
    setPhase("select");
    setActiveScenario(null);
    setResult(null);
  };

  // ── Scenario selection ──
  if (phase === "select") {
    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onBack} className="text-xs text-forge-text-muted hover:text-forge-text transition-colors">&larr; Back</button>
          <span className="text-xs text-forge-text-muted">/</span>
          <span className="text-xs text-forge-danger mono font-semibold">Boot Triage</span>
        </div>
        <p className="text-xs text-forge-text-dim mb-6">Real incident scenarios. Diagnose the boot failure phase, choose the right tools, identify root cause, and recover.</p>

        <div className="grid gap-3">
          {TRIAGE_SCENARIOS.map((scenario) => {
            const done = completedIds.has(scenario.id);
            return (
              <button
                key={scenario.id}
                onClick={() => startScenario(scenario)}
                className={`text-left rounded-xl p-5 border transition-all ${
                  done
                    ? "border-forge-success/30 bg-forge-success/5 hover:border-forge-success/50"
                    : "border-forge-border bg-forge-surface hover:border-forge-border-hover"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold">{scenario.title}</h3>
                      {done && <span className="text-forge-success text-xs">&#10003;</span>}
                    </div>
                    <p className="text-xs text-forge-text-dim leading-relaxed">{scenario.ticket.slice(0, 120)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`mono text-[9px] font-bold px-2 py-0.5 rounded ${
                    scenario.difficulty === "advanced"
                      ? "text-forge-danger bg-forge-danger/10 border border-forge-danger/30"
                      : "text-forge-warning bg-forge-warning/10 border border-forge-warning/30"
                  }`}>
                    {scenario.difficulty.toUpperCase()}
                  </span>
                  <span className="mono text-[9px] text-forge-text-muted">{scenario.steps.length} steps</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Results ──
  if (phase === "results" && result) {
    const pct = Math.round((result.firstTryCount / result.stepResults.length) * 100);
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-xl p-6 border mb-6 text-center ${
          pct >= 80 ? "border-forge-success/30 bg-forge-success/5" : pct >= 50 ? "border-forge-warning/30 bg-forge-warning/5" : "border-forge-danger/30 bg-forge-danger/5"
        }`}>
          <div className={`mono text-4xl font-extrabold mb-1 ${
            pct >= 80 ? "text-forge-success" : pct >= 50 ? "text-forge-warning" : "text-forge-danger"
          }`}>{pct}%</div>
          <p className="text-sm text-forge-text-dim">First-try accuracy</p>
          <p className="text-xs text-forge-text-muted mt-1">{result.firstTryCount}/{result.stepResults.length} steps correct on first attempt</p>
        </div>

        {/* Root cause & resolution */}
        <div className="space-y-3 mb-6">
          <div className="bg-forge-surface border border-forge-border rounded-lg p-4">
            <p className="text-[10px] uppercase text-forge-text-muted font-bold tracking-wider mb-1">ROOT CAUSE</p>
            <p className="text-sm">{result.scenario.rootCause}</p>
          </div>
          <div className="bg-forge-surface border border-forge-border rounded-lg p-4">
            <p className="text-[10px] uppercase text-forge-text-muted font-bold tracking-wider mb-1">RESOLUTION</p>
            <p className="text-sm">{result.scenario.resolution}</p>
          </div>
          <div className="bg-forge-accent/10 border border-forge-accent/30 rounded-lg p-4">
            <p className="text-[10px] uppercase text-forge-accent-text font-bold tracking-wider mb-1">KEY TAKEAWAY</p>
            <p className="text-sm">{result.scenario.keyTakeaway}</p>
          </div>
        </div>

        {/* Step-by-step review */}
        <div className="space-y-2 mb-6">
          <p className="text-[10px] uppercase text-forge-text-muted font-bold tracking-wider">STEP REVIEW</p>
          {result.stepResults.map((sr, i) => (
            <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              sr.correct ? "bg-forge-success/5 text-forge-success" : "bg-forge-danger/5 text-forge-danger"
            }`}>
              <span className="mono text-xs font-bold w-6">{i + 1}.</span>
              <span className="flex-1 text-forge-text text-xs">{sr.step.prompt.slice(0, 80)}...</span>
              <span className="mono text-xs">{sr.correct ? "1st try" : `${sr.attempts} tries`}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={backToSelect} className="flex-1 py-3 bg-forge-surface border border-forge-border rounded-xl text-sm font-medium hover:border-forge-border-hover transition-colors">
            All Scenarios
          </button>
          <button onClick={() => activeScenario && startScenario(activeScenario)} className="flex-1 py-3 bg-forge-accent text-white rounded-xl font-medium hover:bg-forge-accent/90 transition-colors">
            Replay Scenario
          </button>
        </div>
      </div>
    );
  }

  // ── Playing ──
  if (phase === "playing" && activeScenario) {
    return (
      <TriagePlayer
        scenario={activeScenario}
        onComplete={handleComplete}
        onQuit={backToSelect}
      />
    );
  }

  return null;
}

// ═══════════════════════════════════════
// Triage Player — step-by-step game engine
// ═══════════════════════════════════════

function TriagePlayer({
  scenario,
  onComplete,
  onQuit,
}: {
  scenario: TriageScenario;
  onComplete: (result: ScenarioResult) => void;
  onQuit: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"choose" | "wrong" | "correct">("choose");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);

  const step = scenario.steps[stepIndex];
  const isLast = stepIndex === scenario.steps.length - 1;

  const handleChoice = useCallback((label: string) => {
    if (phase !== "choose") return;
    const choice = step.choices.find((c) => c.label === label);
    if (!choice) return;

    setSelectedLabel(label);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (choice.isCorrect) {
      setPhase("correct");
    } else {
      setPhase("wrong");
    }
  }, [phase, step, attempts]);

  const retryStep = () => {
    setSelectedLabel(null);
    setPhase("choose");
  };

  const advanceStep = () => {
    const result: StepResult = { step, correct: attempts === 1, attempts };
    const newResults = [...stepResults, result];
    setStepResults(newResults);

    if (isLast) {
      onComplete({
        scenario,
        stepResults: newResults,
        firstTryCount: newResults.filter((r) => r.correct).length,
      });
    } else {
      setStepIndex(stepIndex + 1);
      setPhase("choose");
      setSelectedLabel(null);
      setAttempts(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="mono text-xs text-forge-text-dim">Step {stepIndex + 1}/{scenario.steps.length}</span>
        <button onClick={onQuit} className="text-xs text-forge-text-muted hover:text-forge-danger transition-colors">Quit</button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-forge-surface-2 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-forge-danger rounded-full transition-all duration-300" style={{ width: `${(stepIndex / scenario.steps.length) * 100}%` }} />
      </div>

      {/* Incident ticket — always visible */}
      <div className="bg-forge-surface-2 border border-forge-border rounded-lg px-4 py-3 mb-4">
        <p className="text-[10px] uppercase text-forge-danger font-bold tracking-wider mb-1">INCIDENT</p>
        <p className="text-xs text-forge-text leading-relaxed">{scenario.ticket}</p>
      </div>

      {/* Step card */}
      <div className="bg-forge-surface border border-forge-border rounded-xl p-6 mb-4">
        {/* Context output if present */}
        {step.context && (
          <div className="mb-4">
            <p className="text-[10px] uppercase text-forge-text-muted font-bold tracking-wider mb-1">OBSERVATION</p>
            <pre className="bg-[#0d1117] rounded-lg px-4 py-3 text-xs mono text-forge-text overflow-x-auto whitespace-pre-wrap">
              {step.context}
            </pre>
          </div>
        )}

        {/* Prompt */}
        <p className="text-base font-medium mb-4">{step.prompt}</p>

        {/* Choices — choose phase */}
        {phase === "choose" && (
          <div className="grid grid-cols-1 gap-2">
            {step.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => handleChoice(c.label)}
                className="p-3 bg-forge-surface-2 border border-forge-border rounded-lg text-sm text-left hover:border-forge-accent/40 hover:bg-forge-accent/5 transition-colors"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Wrong answer feedback */}
        {phase === "wrong" && (
          <div className="space-y-3">
            <div className="bg-forge-danger/10 border border-forge-danger/30 rounded-lg p-4">
              <p className="text-sm text-forge-danger font-medium mb-2">Not the best move.</p>
              <p className="text-xs text-forge-text-dim leading-relaxed">{step.teachingNote}</p>
            </div>
            <button
              onClick={retryStep}
              className="w-full py-2.5 bg-forge-surface-2 border border-forge-border rounded-lg text-sm font-medium hover:border-forge-accent/40 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Correct answer feedback */}
        {phase === "correct" && (
          <div className="space-y-3">
            <div className="bg-forge-success/10 border border-forge-success/30 rounded-lg p-3">
              <p className="text-sm text-forge-success font-medium">
                Correct{attempts === 1 ? " — first try." : "."}
              </p>
            </div>

            <div className="bg-forge-surface-2 rounded-lg px-4 py-3">
              <p className="text-[10px] uppercase text-forge-text-muted font-bold tracking-wider mb-1">WHY THIS IS RIGHT</p>
              <p className="text-sm text-forge-text leading-relaxed">{step.correctExplanation}</p>
            </div>

            <button
              onClick={advanceStep}
              className="w-full py-3 bg-forge-accent text-white rounded-xl font-medium hover:bg-forge-accent/90 transition-colors"
            >
              {isLast ? "See Results" : "Next Step \u2192"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
