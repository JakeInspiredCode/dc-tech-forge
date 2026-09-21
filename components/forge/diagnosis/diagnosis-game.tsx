"use client";

import { useState, useCallback } from "react";
import { DiagnosisScenario, DiagnosisStep } from "@/lib/seeds/diagnosis-scenarios";

export interface DiagnosisResult {
  scenario: DiagnosisScenario;
  stepResults: { step: DiagnosisStep; correct: boolean; attempts: number }[];
  totalCorrectFirstTry: number;
  totalSteps: number;
}

interface Props {
  scenario: DiagnosisScenario;
  onComplete: (result: DiagnosisResult) => void;
  onQuit: () => void;
}

export default function DiagnosisGame({ scenario, onComplete, onQuit }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"choose" | "output" | "teaching">("choose");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [stepResults, setStepResults] = useState<{ step: DiagnosisStep; correct: boolean; attempts: number }[]>([]);

  const step = scenario.steps[stepIndex];
  const isLastStep = stepIndex === scenario.steps.length - 1;

  const handleChoice = useCallback((label: string) => {
    if (phase !== "choose") return;
    const choice = step.choices.find((c) => c.label === label);
    if (!choice) return;

    setSelectedChoice(label);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (choice.isCorrect) {
      setWasCorrect(true);
      setPhase("output");
    } else {
      // Wrong — show teaching note
      setWasCorrect(false);
      setPhase("teaching");
    }
  }, [phase, step, attempts]);

  const handleContinueFromTeaching = () => {
    // Reset to let them try again
    setSelectedChoice(null);
    setPhase("choose");
  };

  const handleNextStep = () => {
    const result = { step, correct: attempts === 1, attempts };
    const newResults = [...stepResults, result];
    setStepResults(newResults);

    if (isLastStep) {
      onComplete({
        scenario,
        stepResults: newResults,
        totalCorrectFirstTry: newResults.filter((r) => r.correct).length,
        totalSteps: newResults.length,
      });
    } else {
      setStepIndex(stepIndex + 1);
      setPhase("choose");
      setSelectedChoice(null);
      setWasCorrect(false);
      setAttempts(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs mono text-v2-text-dim">
          Step {stepIndex + 1}/{scenario.steps.length}
        </span>
        <button onClick={onQuit} className="text-xs text-v2-text-muted hover:text-v2-danger transition-colors">
          Quit
        </button>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-v2-bg-elevated rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-v2-cyan rounded-full transition-all duration-300"
          style={{ width: `${((stepIndex) / scenario.steps.length) * 100}%` }}
        />
      </div>

      {/* Scenario context (always visible) */}
      <div className="bg-v2-bg-elevated border border-v2-border rounded-lg px-4 py-3 mb-4">
        <p className="text-xs text-v2-text-muted mb-1">Scenario</p>
        <p className="text-sm">{scenario.description}</p>
      </div>

      {/* Step prompt */}
      <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-6 mb-4">
        <p className="text-lg font-medium mb-4">{step.prompt}</p>

        {/* Choices — choose phase */}
        {phase === "choose" && (
          <div className="grid grid-cols-2 gap-2">
            {step.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => handleChoice(c.label)}
                className="p-3 bg-v2-bg-elevated border border-v2-border rounded-lg text-sm mono text-left hover:border-v2-cyan/40 hover:bg-v2-cyan/5 transition-colors"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Teaching note — wrong answer */}
        {phase === "teaching" && (
          <div className="space-y-3">
            <div className="bg-v2-danger/10 border border-v2-danger/30 rounded-lg p-4">
              <p className="text-sm text-v2-danger font-medium mb-1">
                Not quite — <span className="mono">{selectedChoice}</span>
              </p>
              <p className="text-xs text-v2-text-dim">{step.teachingNote}</p>
            </div>
            <button
              onClick={handleContinueFromTeaching}
              className="w-full py-2.5 bg-v2-bg-elevated border border-v2-border rounded-lg text-sm font-medium hover:border-v2-cyan/40 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Command output — correct answer */}
        {phase === "output" && (
          <div className="space-y-3">
            <div className="bg-v2-success/10 border border-v2-success/30 rounded-lg p-3">
              <p className="text-sm text-v2-success font-medium">
                Correct{attempts === 1 ? " — first try!" : ""}
              </p>
            </div>

            {/* Command shown */}
            <div>
              <p className="text-[10px] uppercase text-v2-text-muted font-semibold tracking-wider mb-1">Command</p>
              <code className="block bg-[#0d1117] rounded-lg px-4 py-2 text-sm mono text-emerald-400 overflow-x-auto">
                $ {step.command}
              </code>
            </div>

            {/* Output */}
            <div>
              <p className="text-[10px] uppercase text-v2-text-muted font-semibold tracking-wider mb-1">Output</p>
              <pre className="bg-[#0d1117] rounded-lg px-4 py-3 text-xs mono text-v2-text overflow-x-auto whitespace-pre-wrap">
                {step.output}
              </pre>
            </div>

            {/* Interpretation */}
            <div className="bg-v2-bg-elevated rounded-lg px-4 py-3">
              <p className="text-[10px] uppercase text-v2-text-muted font-semibold tracking-wider mb-1">Interpretation</p>
              <p className="text-sm">{step.interpretation}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPhase("choose");
                  setSelectedChoice(null);
                  setWasCorrect(false);
                  setAttempts(0);
                }}
                className="flex-1 py-3 bg-v2-bg-elevated border border-v2-border rounded-xl text-sm font-medium hover:border-v2-cyan/40 transition-colors"
              >
                Practice Again
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 py-3 bg-v2-cyan text-v2-bg-deep rounded-xl font-medium hover:bg-v2-cyan-bright transition-colors"
              >
                {isLastStep ? "See Results" : "Next Step →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
