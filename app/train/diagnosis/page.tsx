"use client";

import { useState } from "react";
import { useMutation } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import DiagnosisGame, { DiagnosisResult } from "@/components/forge/diagnosis/diagnosis-game";
import DiagnosisResults from "@/components/forge/diagnosis/diagnosis-results";
import scenarios, { DiagnosisScenario, DiagnosisDifficulty } from "@/lib/seeds/diagnosis-scenarios";
import ToolPage from "@/components/ui/tool-page";

type Screen = "browse" | "playing" | "results";

const DIFFICULTY_INFO: Record<DiagnosisDifficulty, { label: string; color: string; description: string }> = {
  learning: { label: "Learning", color: "text-emerald-400", description: "System shows commands — you read output and pick answers" },
  guided: { label: "Guided", color: "text-sky-400", description: "You choose what to check — system shows the command" },
  independent: { label: "Independent", color: "text-orange-400", description: "You choose what AND which command to run" },
  full: { label: "Full", color: "text-red-400", description: "Multi-step compound problems" },
};

export default function DiagnosisLabPage() {
  const [screen, setScreen] = useState<Screen>("browse");
  const [activeScenario, setActiveScenario] = useState<DiagnosisScenario | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<DiagnosisDifficulty | "all">("all");

  const addHistory = useMutation(api.forgeDiagnosisHistory.add);
  const addPoints = useMutation(api.forgeProfile.addPoints);
  const checkBadges = useMutation(api.forgeProfile.checkAndAwardBadges);

  const filtered = difficultyFilter === "all"
    ? scenarios
    : scenarios.filter((s) => s.difficulty === difficultyFilter);

  const startScenario = (s: DiagnosisScenario) => {
    setActiveScenario(s);
    setResult(null);
    setScreen("playing");
  };

  const handleDiagnosisComplete = async (r: DiagnosisResult) => {
    setResult(r);
    setScreen("results");

    const score = r.totalSteps > 0 ? Math.round((r.totalCorrectFirstTry / r.totalSteps) * 100) : 0;
    const xpEarned = Math.round(10 + (score / 100) * 20);

    try {
      await addHistory({
        scenarioId: r.scenario.id,
        difficulty: r.scenario.difficulty,
        score,
        stepsCompleted: r.stepResults.filter((s) => s.correct).length,
        totalSteps: r.totalSteps,
        xpEarned,
      });
      await addPoints({ points: xpEarned });
      await checkBadges({});
    } catch {
      // Silently handle
    }
  };

  if (screen === "playing" && activeScenario) {
    return (
      <div className="min-h-screen bg-v2-bg-deep">
        <div className="px-4 sm:px-6 py-8">
          <DiagnosisGame
            scenario={activeScenario}
            onComplete={handleDiagnosisComplete}
            onQuit={() => setScreen("browse")}
          />
        </div>
      </div>
    );
  }

  if (screen === "results" && result && activeScenario) {
    return (
      <div className="min-h-screen bg-v2-bg-deep">
        <div className="px-4 sm:px-6 py-8">
          <DiagnosisResults
            result={result}
            onPlayAgain={() => startScenario(activeScenario)}
            onBack={() => setScreen("browse")}
          />
        </div>
      </div>
    );
  }

  // Browse scenarios
  return (
    <ToolPage
      title="Diagnosis Lab"
      subtitle={`Step-by-step troubleshooting — ${scenarios.length} scenarios across 4 difficulty levels.`}
      width="wide"
    >

        {/* Difficulty filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setDifficultyFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs mono border transition-colors ${
              difficultyFilter === "all"
                ? "bg-v2-cyan/20 text-v2-cyan border-v2-cyan/40"
                : "border-v2-border text-v2-text-dim hover:text-v2-text"
            }`}
          >
            All ({scenarios.length})
          </button>
          {(["learning", "guided", "independent", "full"] as DiagnosisDifficulty[]).map((d) => {
            const info = DIFFICULTY_INFO[d];
            const count = scenarios.filter((s) => s.difficulty === d).length;
            return (
              <button
                key={d}
                onClick={() => setDifficultyFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs mono border transition-colors ${
                  difficultyFilter === d
                    ? "bg-v2-cyan/20 text-v2-cyan border-v2-cyan/40"
                    : "border-v2-border text-v2-text-dim hover:text-v2-text"
                }`}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Scenario cards */}
        <div className="space-y-3">
          {filtered.map((s) => {
            const info = DIFFICULTY_INFO[s.difficulty];
            return (
              <button
                key={s.id}
                onClick={() => startScenario(s)}
                className="w-full bg-v2-bg-surface border border-v2-border rounded-xl p-5 text-left hover:border-v2-cyan/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs mono font-semibold ${info.color}`}>
                    {info.label.toUpperCase()}
                  </span>
                  <span className="font-semibold text-sm">{s.title}</span>
                  <span className="text-[10px] mono text-v2-text-muted bg-v2-bg-elevated px-1.5 py-0.5 rounded">
                    {s.steps.length} steps
                  </span>
                  <span className="text-[10px] mono text-v2-text-muted">{s.category}</span>
                </div>
                <p className="text-xs text-v2-text-dim">{s.description}</p>
              </button>
            );
          })}
        </div>
    </ToolPage>
  );
}
