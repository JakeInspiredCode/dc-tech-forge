"use client";

import { useEffect, useState } from "react";
import { EvalScore } from "@/lib/forge/evaluator";

interface SpeedRunFeedbackProps {
  score: EvalScore;
  points: number;
  timeAdjustment: number;
  feedback: string;
  expectedAnswer?: string;
  onDone: () => void;
  onOverride?: (newScore: EvalScore) => void;
}

export default function SpeedRunFeedback({
  score,
  points,
  timeAdjustment,
  feedback,
  expectedAnswer,
  onDone,
  onOverride,
}: SpeedRunFeedbackProps) {
  const [visible, setVisible] = useState(true);
  const [overridden, setOverridden] = useState(false);
  const duration = score === "wrong" ? 4000 : score === "partial" ? 3500 : 900;

  useEffect(() => {
    if (overridden) return; // don't auto-dismiss after override
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 150);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDone, overridden]);

  const config = {
    correct: {
      bg: "bg-forge-success/10 border-forge-success/30",
      text: "text-forge-success",
      glow: "forge-glow-success",
      label: "✓ Correct",
      timeColor: "text-forge-success",
    },
    partial: {
      bg: "bg-forge-warning/10 border-forge-warning/30",
      text: "text-forge-warning",
      glow: "",
      label: "~ Partial",
      timeColor: "text-forge-warning",
    },
    wrong: {
      bg: "bg-forge-danger/10 border-forge-danger/30",
      text: "text-forge-danger",
      glow: "forge-glow-danger",
      label: "✗ Wrong",
      timeColor: "text-forge-danger",
    },
  }[score];

  return (
    <div
      className={`
        rounded-xl border p-4 transition-opacity duration-150
        ${config.bg} ${config.glow}
        ${visible ? "opacity-100" : "opacity-0"}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`mono font-bold text-sm ${config.text}`}>{config.label}</span>
        <div className="flex items-center gap-3 mono text-sm">
          {points > 0 && (
            <span className="text-forge-accent-text font-bold">+{points} pts</span>
          )}
          <span className={`font-bold ${config.timeColor}`}>
            {timeAdjustment > 0 ? `+${timeAdjustment}s` : `${timeAdjustment}s`}
          </span>
        </div>
      </div>

      {feedback && (
        <p className="text-xs text-forge-text-dim mono">{feedback}</p>
      )}

      {score === "wrong" && expectedAnswer && (
        <div className="mt-2 pt-2 border-t border-forge-border/50">
          <p className="text-xs text-forge-text-dim mb-1">Expected:</p>
          <p className="text-xs mono text-forge-text bg-forge-surface-2 px-2 py-1 rounded truncate">
            {expectedAnswer.split("\n")[0].replace(/`/g, "").slice(0, 120)}
          </p>
        </div>
      )}

      {score !== "correct" && onOverride && !overridden && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOverridden(true);
            onOverride("correct");
          }}
          className="mt-2 w-full py-1.5 rounded-lg border text-xs font-medium mono transition-colors
            bg-forge-success/10 text-forge-success/80 border-forge-success/20
            hover:bg-forge-success/20 hover:text-forge-success"
        >
          Actually correct
        </button>
      )}
    </div>
  );
}
