"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import type { Scenario } from "@/lib/scenarios";

interface StepResult {
  stepIndex: number;
  userResponse: string;
  matchedTerms: string[];
  totalTerms: number;
  usedHints: boolean;
}

export default function DrillWalkthrough({
  scenario,
  onComplete,
}: {
  scenario: Scenario;
  onComplete?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(false);
  const [matchedTerms, setMatchedTerms] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [results, setResults] = useState<StepResult[]>([]);

  const addDrill = useMutation(api.forgeDrills.add);

  const s = scenario.steps[step];

  const checkAnswer = useCallback(() => {
    const lower = userInput.toLowerCase();
    const matched = s.keyTerms.filter((t) => {
      // Check direct term match
      if (lower.includes(t.toLowerCase())) return true;
      // Check synonyms if keyTermEntries exist
      const entry = s.keyTermEntries?.find((e) => e.term === t);
      if (entry?.synonyms) {
        return entry.synonyms.some((syn) => lower.includes(syn.toLowerCase()));
      }
      return false;
    });
    setMatchedTerms(matched);
    setShowAnswer(true);
    setResults((prev) => [
      ...prev,
      {
        stepIndex: step,
        userResponse: userInput,
        matchedTerms: matched,
        totalTerms: s.keyTerms.length,
        usedHints: hintsUsed,
      },
    ]);
  }, [userInput, s, step, hintsUsed]);

  const nextStep = useCallback(async () => {
    if (step + 1 >= scenario.steps.length) {
      setComplete(true);

      // Calculate overall hit rate and save to Convex
      const allResults = results;
      const totalTerms = allResults.reduce((s, r) => s + r.totalTerms, 0);
      const totalMatched = allResults.reduce(
        (s, r) => s + r.matchedTerms.length,
        0
      );
      const hitRate = totalTerms > 0 ? Math.round((totalMatched / totalTerms) * 100) : 0;

      try {
        await addDrill({
          scenarioId: scenario.id,
          timestamp: new Date().toISOString(),
          totalSteps: scenario.steps.length,
          completedSteps: scenario.steps.length,
          steps: allResults.map((r) => ({
            stepIndex: r.stepIndex,
            userResponse: r.userResponse,
            matchedTerms: r.matchedTerms,
            totalTerms: r.totalTerms,
            usedHints: r.usedHints,
          })),
          overallTermHitRate: hitRate,
        });
      } catch {
        // Silently handle — drill still works without persistence
      }
    } else {
      setStep(step + 1);
      setUserInput("");
      setShowAnswer(false);
      setShowHints(false);
      setHintsUsed(false);
      setMatchedTerms([]);
    }
  }, [step, scenario, results, addDrill]);

  const reset = () => {
    setStep(0);
    setUserInput("");
    setShowAnswer(false);
    setShowHints(false);
    setHintsUsed(false);
    setComplete(false);
    setMatchedTerms([]);
    setResults([]);
  };

  const overallHitRate = results.length > 0
    ? Math.round(
        (results.reduce((s, r) => s + r.matchedTerms.length, 0) /
          results.reduce((s, r) => s + r.totalTerms, 0)) *
          100
      )
    : 0;

  // ── Completion Screen ──
  if (complete) {
    return (
      <div className="p-8 text-center max-w-2xl mx-auto">
        <div className="mono text-2xl font-extrabold text-green-400 mb-3">
          INCIDENT RESOLVED
        </div>
        <div className="text-5xl font-extrabold mono mb-2" style={{
          color: overallHitRate >= 80 ? "#22c55e" : overallHitRate >= 50 ? "#f59e0b" : "#ef4444",
        }}>
          {overallHitRate}%
        </div>
        <div className="text-v2-text-dim text-sm mb-6">
          Overall key-term coverage
        </div>

        {/* Per-step breakdown */}
        <div className="text-left space-y-3 mb-6">
          {results.map((r, i) => {
            const pct = r.totalTerms > 0 ? Math.round((r.matchedTerms.length / r.totalTerms) * 100) : 0;
            return (
              <div
                key={i}
                className="bg-v2-bg-surface rounded-lg p-4 border-l-[3px]"
                style={{
                  borderLeftColor: pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444",
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="mono text-xs text-v2-text-muted">
                    STEP {i + 1}
                  </span>
                  <span className="mono text-xs font-bold" style={{
                    color: pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444",
                  }}>
                    {r.matchedTerms.length}/{r.totalTerms} terms
                    {r.usedHints && <span className="text-v2-warning ml-2">(hints used)</span>}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {scenario.steps[i].keyTerms.map((t) => (
                    <span
                      key={t}
                      className="mono text-[10px] px-2 py-0.5 rounded border"
                      style={{
                        background: r.matchedTerms.includes(t) ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.06)",
                        color: r.matchedTerms.includes(t) ? "#22c55e" : "#ef4444",
                        borderColor: r.matchedTerms.includes(t) ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.2)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-v2-bg-surface rounded-lg p-4 mb-6 text-left">
          <div className="mono text-xs text-v2-text-muted font-bold mb-2">INCIDENT SUMMARY</div>
          <div className="text-sm text-v2-text-dim leading-relaxed mb-3">
            {scenario.summary}
          </div>
          <div className="text-sm text-v2-warning leading-relaxed italic">
            {scenario.keyPrinciple}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-v2-danger text-v2-bg-deep rounded-lg font-bold mono text-sm hover:brightness-110 transition-all"
          >
            RUN AGAIN
          </button>
          {onComplete && (
            <button
              onClick={onComplete}
              className="px-6 py-2.5 bg-v2-bg-elevated text-v2-text-dim rounded-lg font-bold mono text-sm border border-v2-border hover:border-v2-cyan/30 transition-all"
            >
              BACK TO DRILLS
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Active Step ──
  return (
    <div className="max-w-2xl mx-auto p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="mono text-xs text-v2-danger font-bold">
          STEP {step + 1}/{scenario.steps.length}
        </span>
        <span className="mono text-xs text-v2-text-muted">
          {scenario.title}
        </span>
      </div>

      {/* Step progress bar */}
      <div className="flex gap-1 mb-5">
        {scenario.steps.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full flex-1 transition-all duration-300"
            style={{
              background:
                i < step
                  ? "#22c55e"
                  : i === step
                  ? "#ef4444"
                  : "#222",
            }}
          />
        ))}
      </div>

      {/* Prompt */}
      <div className="bg-v2-bg-surface border border-[rgba(239,68,68,0.15)] rounded-lg p-4 mb-4">
        <div className="text-sm text-v2-text leading-relaxed">
          {s.prompt}
        </div>
      </div>

      {/* Input / Response */}
      {!showAnswer && (
        <>
          <textarea aria-label="Describe your approach"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe your approach..."
            rows={4}
            className="w-full bg-v2-bg-deep border border-v2-border rounded-lg p-3 text-v2-text-dim text-sm leading-relaxed resize-y outline-none focus:border-v2-cyan/30 placeholder:text-v2-text-muted"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={checkAnswer}
              disabled={!userInput.trim()}
              className="px-5 py-2 rounded-lg font-bold mono text-xs transition-all"
              style={{
                background: userInput.trim() ? "#ef4444" : "#222",
                color: userInput.trim() ? "#fff" : "var(--color-v2-text-muted)",
                cursor: userInput.trim() ? "pointer" : "default",
              }}
            >
              SUBMIT
            </button>
            <button
              onClick={() => {
                setShowHints(!showHints);
                if (!showHints) setHintsUsed(true);
              }}
              className="px-5 py-2 bg-v2-bg-elevated text-v2-warning border border-[rgba(245,158,11,0.2)] rounded-lg mono text-xs cursor-pointer hover:border-[rgba(245,158,11,0.4)] transition-all"
            >
              {showHints ? "HIDE HINTS" : "SHOW HINTS"}
            </button>
          </div>
          {showHints && (
            <div className="mt-3 p-3 bg-[rgba(245,158,11,0.03)] border border-[rgba(245,158,11,0.1)] rounded-lg">
              {s.hints.map((h, i) => (
                <div key={i} className="text-sm text-v2-warning mb-1 last:mb-0">
                  &rarr; {h}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Answer reveal */}
      {showAnswer && (
        <div className="mt-3">
          {/* Key terms */}
          <div className="mb-3">
            <span className="mono text-[11px] text-green-400 font-bold">
              KEY TERMS HIT: {matchedTerms.length}/{s.keyTerms.length}
            </span>
            <div className="flex gap-1.5 flex-wrap mt-2">
              {s.keyTerms.map((t) => (
                <span
                  key={t}
                  className="mono text-[10px] px-2 py-0.5 rounded border"
                  style={{
                    background: matchedTerms.includes(t)
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(239,68,68,0.06)",
                    color: matchedTerms.includes(t) ? "#22c55e" : "#ef4444",
                    borderColor: matchedTerms.includes(t)
                      ? "rgba(34,197,94,0.3)"
                      : "rgba(239,68,68,0.2)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Expected response */}
          <div className="bg-[rgba(34,197,94,0.03)] border border-[rgba(34,197,94,0.12)] rounded-lg p-4">
            <div className="mono text-[11px] text-green-400 font-bold mb-2">
              EXPECTED RESPONSE
            </div>
            <div className="text-sm text-v2-text-dim leading-relaxed">
              {s.answer}
            </div>
          </div>

          <button
            onClick={nextStep}
            className="mt-4 px-6 py-2.5 bg-v2-danger text-v2-bg-deep rounded-lg font-bold mono text-sm hover:brightness-110 transition-all"
          >
            {step + 1 >= scenario.steps.length ? "COMPLETE INCIDENT" : "NEXT STEP →"}
          </button>
        </div>
      )}
    </div>
  );
}
