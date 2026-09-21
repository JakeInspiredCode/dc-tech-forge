"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { topicName, ForgeCard, Quality } from "@/lib/types";

interface FlashcardProps {
  card: ForgeCard;
  onRate: (quality: Quality, responseTime: number) => void;
  index: number;
  total: number;
}

const RATING_BUTTONS: { label: string; quality: Quality; color: string; key: string }[] = [
  { label: "Again", quality: 1 as Quality, color: "bg-v2-danger/20 text-v2-danger border-v2-danger/30 hover:bg-v2-danger/30", key: "1" },
  { label: "Hard", quality: 3 as Quality, color: "bg-v2-warning/20 text-v2-warning border-v2-warning/30 hover:bg-v2-warning/30", key: "2" },
  { label: "Good", quality: 4 as Quality, color: "bg-v2-cyan/20 text-v2-cyan border-v2-cyan/30 hover:bg-v2-cyan/30", key: "3" },
  { label: "Easy", quality: 5 as Quality, color: "bg-v2-success/20 text-v2-success border-v2-success/30 hover:bg-v2-success/30", key: "4" },
];

export default function Flashcard({ card, onRate, index, total }: FlashcardProps) {
  // Each card gets a fresh mount via key={card.id} from CardQueue,
  // so initial state is always clean — no reset logic needed.
  const [flipped, setFlipped] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const timerStart = useRef<number>(Date.now());
  const flipTime = useRef<number>(0);

  const handleFlip = useCallback(() => {
    if (!hasRevealed) {
      flipTime.current = Date.now() - timerStart.current;
      setHasRevealed(true);
    }
    setFlipped((f) => !f);
  }, [hasRevealed]);

  const handleRate = useCallback((quality: Quality) => {
    onRate(quality, flipTime.current);
  }, [onRate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      }
      if (hasRevealed) {
        const btn = RATING_BUTTONS.find((b) => b.key === e.key);
        if (btn) handleRate(btn.quality);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasRevealed, handleFlip, handleRate]);

  const tierLabel = ["", "T1 Foundation", "T2 Application", "T3 Scenario", "T4 Branching"][card.tier];
  const tierColor = ["", "text-v2-text-dim", "text-v2-cyan", "text-v2-warning", "text-v2-danger"][card.tier];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex-1 h-1 bg-v2-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-v2-cyan rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-v2-text-dim mono">{index + 1}/{total}</span>
      </div>

      {/* Rating buttons — above card, visible once revealed */}
      <div className={`mb-3 flex gap-2 justify-center transition-opacity duration-150 ${hasRevealed ? "opacity-100" : "opacity-0 pointer-events-none"}`} style={{ minHeight: 36 }}>
        {RATING_BUTTONS.map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleRate(btn.quality)}
            className={`px-3 py-1.5 rounded border text-xs font-medium transition-all duration-150 ${btn.color}`}
          >
            {btn.label} <span className="opacity-80 mono">[{btn.key}]</span>
          </button>
        ))}
      </div>

      {/* Card — fixed height to prevent jitter */}
      <div className="card-flip cursor-pointer" onClick={handleFlip} style={{ height: 240 }}>
        <div className={`card-flip-inner ${flipped ? "flipped" : ""}`} style={{ height: "100%" }}>
          {/* Front */}
          <div className="card-front" style={{ height: "100%" }} aria-hidden={flipped}>
            <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-6 h-full flex flex-col hover:border-v2-cyan/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs mono ${tierColor}`}>{tierLabel}</span>
                <span className="text-xs text-v2-text-muted">{topicName(card.topicId)}</span>
              </div>
              <div className="flex-1 flex items-center justify-center overflow-y-auto">
                <div className="markdown-content text-center text-base leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.front}</ReactMarkdown>
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="text-[11px] text-v2-text-muted">Space or tap to reveal</span>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="card-back" style={{ height: "100%" }} aria-hidden={!flipped}>
            <div className="bg-v2-bg-surface border border-v2-cyan/30 rounded-xl p-6 h-full flex flex-col glow-accent">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs mono ${tierColor}`}>{tierLabel}</span>
                <span className="text-xs text-v2-cyan mono">ANSWER</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="markdown-content text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.back}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
