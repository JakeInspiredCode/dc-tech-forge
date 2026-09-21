"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ForgeCard, Quality } from "@/lib/types";

interface StepRevealProps {
  card: ForgeCard;
  onRate: (quality: Quality, responseTime: number) => void;
  index: number;
  total: number;
}

const RATING_BUTTONS: { label: string; quality: Quality; color: string }[] = [
  { label: "Again", quality: 1 as Quality, color: "bg-v2-danger/20 text-v2-danger border-v2-danger/30" },
  { label: "Hard", quality: 3 as Quality, color: "bg-v2-warning/20 text-v2-warning border-v2-warning/30" },
  { label: "Good", quality: 4 as Quality, color: "bg-v2-cyan/20 text-v2-cyan border-v2-cyan/30" },
  { label: "Easy", quality: 5 as Quality, color: "bg-v2-success/20 text-v2-success border-v2-success/30" },
];

export default function StepReveal({ card, onRate, index, total }: StepRevealProps) {
  const [revealedSteps, setRevealedSteps] = useState(1);
  const [showFinal, setShowFinal] = useState(false);
  const timerStart = useRef(Date.now());
  const steps = card.steps ?? [];

  useEffect(() => {
    setRevealedSteps(1);
    setShowFinal(false);
    timerStart.current = Date.now();
  }, [card.id]);

  const handleNextStep = () => {
    if (revealedSteps < steps.length) {
      setRevealedSteps(revealedSteps + 1);
    } else {
      setShowFinal(true);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-v2-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-v2-danger rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-v2-text-dim mono">{index + 1}/{total}</span>
      </div>

      {/* Incident header */}
      <div className="bg-v2-bg-surface border border-v2-danger/30 rounded-xl p-6 mb-4 forge-glow-danger">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs mono text-v2-danger bg-v2-danger/10 px-2 py-0.5 rounded">INCIDENT — T4 BRANCHING</span>
        </div>
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.front}</ReactMarkdown>
        </div>
      </div>

      {/* Steps */}
      {steps.slice(0, revealedSteps).map((step, i) => (
        <div key={i} className="bg-v2-bg-surface border border-v2-border rounded-xl p-5 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs mono text-v2-cyan bg-v2-cyan/10 px-2 py-0.5 rounded">
              STEP {i + 1}/{steps.length}
            </span>
          </div>
          <div className="markdown-content text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{step}</ReactMarkdown>
          </div>
        </div>
      ))}

      {/* Final answer / resolution */}
      {showFinal && (
        <div className="bg-v2-bg-surface border border-v2-success/30 rounded-xl p-5 mb-4 forge-glow-success">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs mono text-v2-success bg-v2-success/10 px-2 py-0.5 rounded">RESOLUTION</span>
          </div>
          <div className="markdown-content text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.back}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex justify-center gap-3">
        {!showFinal ? (
          <button
            onClick={handleNextStep}
            className="px-6 py-2.5 bg-v2-cyan/20 text-v2-cyan border border-v2-cyan/30 rounded-lg text-sm font-medium hover:bg-v2-cyan/30 transition-colors"
          >
            {revealedSteps < steps.length ? `Next Step (${revealedSteps}/${steps.length})` : "Show Resolution"}
          </button>
        ) : (
          RATING_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              onClick={() => onRate(btn.quality, Date.now() - timerStart.current)}
              className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${btn.color}`}
            >
              {btn.label}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
