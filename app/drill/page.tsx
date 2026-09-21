"use client";

import { useState } from "react";
import { useQuery } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import DrillWalkthrough from "@/components/drill-walkthrough";
import { SCENARIOS, type Scenario } from "@/lib/scenarios";

const DIFFICULTY_COLORS = {
  intermediate: "#f59e0b",
  advanced: "#ef4444",
  expert: "#a855f7",
};

const DIFFICULTY_LABELS = {
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
  expert: "EXPERT",
};

function ScenarioCard({
  scenario,
  bestScore,
  attempts,
  onSelect,
}: {
  scenario: Scenario;
  bestScore: number | null;
  attempts: number;
  onSelect: () => void;
}) {
  const diffColor = DIFFICULTY_COLORS[scenario.difficulty];

  return (
    <button
      onClick={onSelect}
      className="text-left bg-forge-surface border border-forge-border rounded-lg p-5 hover:border-forge-border-hover transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-forge-text group-hover:text-white transition-colors">
            {scenario.title}
          </h3>
          <p className="text-xs text-forge-text-muted mt-1 leading-relaxed">
            {scenario.description}
          </p>
        </div>
        {bestScore !== null && (
          <div
            className="mono text-lg font-extrabold ml-4 shrink-0"
            style={{
              color:
                bestScore >= 80 ? "#22c55e" : bestScore >= 50 ? "#f59e0b" : "#ef4444",
            }}
          >
            {bestScore}%
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="mono text-[9px] font-bold px-2 py-0.5 rounded"
          style={{
            color: diffColor,
            background: `${diffColor}15`,
            border: `1px solid ${diffColor}30`,
          }}
        >
          {DIFFICULTY_LABELS[scenario.difficulty]}
        </span>
        <span className="mono text-[9px] text-forge-text-muted">
          {scenario.steps.length} steps
        </span>
        {scenario.topicTags.map((tag) => (
          <span
            key={tag}
            className="mono text-[9px] px-1.5 py-0.5 bg-forge-surface-2 text-forge-text-muted rounded"
          >
            {tag}
          </span>
        ))}
        {attempts > 0 && (
          <span className="mono text-[9px] text-forge-accent-text">
            {attempts} attempt{attempts !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}

export default function DrillPage() {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const drillHistory = (useQuery(api.forgeDrills.getAll, {}) ?? []) as Array<{ scenarioId: string; overallTermHitRate: number }>;

  if (activeScenario) {
    return (
      <>
        <div className="py-6">
          <DrillWalkthrough
            scenario={activeScenario}
            onComplete={() => setActiveScenario(null)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="mono text-xl font-bold text-forge-danger mb-1">
            Incident Drills
          </h1>
          <p className="text-sm text-forge-text-dim">
            Walk through real DC ops incident scenarios step by step. Type your
            response at each step, then compare against the expected approach.
            Key terms are tracked to measure your coverage.
          </p>
        </div>

        {/* Stats bar */}
        {drillHistory.length > 0 && (
          <div className="flex gap-4 mb-6 p-4 bg-forge-surface rounded-lg border border-forge-border">
            <div>
              <div className="mono text-[10px] text-forge-text-muted font-bold">DRILLS COMPLETED</div>
              <div className="mono text-lg font-extrabold text-forge-text">
                {drillHistory.length}
              </div>
            </div>
            <div>
              <div className="mono text-[10px] text-forge-text-muted font-bold">BEST SCORE</div>
              <div className="mono text-lg font-extrabold text-green-400">
                {Math.max(...drillHistory.map((d) => d.overallTermHitRate))}%
              </div>
            </div>
            <div>
              <div className="mono text-[10px] text-forge-text-muted font-bold">AVG SCORE</div>
              <div className="mono text-lg font-extrabold text-forge-warning">
                {Math.round(
                  drillHistory.reduce((s, d) => s + d.overallTermHitRate, 0) /
                    drillHistory.length
                )}%
              </div>
            </div>
          </div>
        )}

        {/* Scenario grid */}
        <div className="grid gap-4">
          {SCENARIOS.map((scenario) => {
            const attempts = drillHistory.filter(
              (d) => d.scenarioId === scenario.id
            );
            const best =
              attempts.length > 0
                ? Math.max(...attempts.map((d) => d.overallTermHitRate))
                : null;

            return (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                bestScore={best}
                attempts={attempts.length}
                onSelect={() => setActiveScenario(scenario)}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
