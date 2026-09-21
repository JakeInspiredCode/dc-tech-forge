"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QuickDrawItem } from "@/lib/seeds/quick-draw-modules";

export interface QuickDrawResult {
  item: QuickDrawItem;
  userAnswer: string;
  correct: boolean;
  timeMs: number;
}

export interface QuickDrawSummary {
  results: QuickDrawResult[];
  totalTime: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  avgTimeMs: number;
}

interface Props {
  items: QuickDrawItem[];
  mode: "type" | "choice";
  onComplete: (summary: QuickDrawSummary) => void;
  onQuit: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue(items: QuickDrawItem[]): QuickDrawItem[] {
  return shuffleArray(items);
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[`'"]/g, "").replace(/\s+/g, " ");
}

function isCorrect(userAnswer: string, item: QuickDrawItem): boolean {
  const norm = normalize(userAnswer);
  if (norm === normalize(item.answer)) return true;
  if (item.acceptableAnswers) {
    return item.acceptableAnswers.some((a) => normalize(a) === norm);
  }
  // Partial match: if answer is short (<=3 words), require exact. Otherwise allow substring.
  const words = item.answer.split(/\s+/);
  if (words.length <= 2) return false;
  return normalize(item.answer).includes(norm) && norm.length > 3;
}

function generateChoices(correct: QuickDrawItem, allItems: QuickDrawItem[]): string[] {
  const others = allItems
    .filter((i) => i.id !== correct.id && i.answer !== correct.answer)
    .map((i) => i.answer);
  const shuffled = shuffleArray(others).slice(0, 3);
  const choices = shuffleArray([correct.answer, ...shuffled]);
  return choices;
}

export default function QuickDrawGame({ items, mode, onComplete, onQuit }: Props) {
  const [queue, setQueue] = useState<QuickDrawItem[]>(() => buildQueue(items));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [results, setResults] = useState<QuickDrawResult[]>([]);
  const [showFeedback, setShowFeedback] = useState<"correct" | "wrong" | null>(null);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState("");
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [sessionStart] = useState(Date.now());
  const [choices, setChoices] = useState<string[]>([]);
  const [missQueue, setMissQueue] = useState<QuickDrawItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = queue[currentIndex];
  const total = queue.length + missQueue.length;
  const answered = results.length;

  useEffect(() => {
    if (mode === "choice" && current) {
      setChoices(generateChoices(current, items));
    }
  }, [currentIndex, current, mode, items]);

  useEffect(() => {
    setQuestionStart(Date.now());
    setUserInput("");
    if (mode === "type") inputRef.current?.focus();
  }, [currentIndex, mode]);

  const advance = useCallback((answer: string) => {
    if (!current) return;
    const timeMs = Date.now() - questionStart;
    const correct = isCorrect(answer, current);

    const result: QuickDrawResult = {
      item: current,
      userAnswer: answer,
      correct,
      timeMs,
    };

    const newResults = [...results, result];
    setResults(newResults);

    if (!correct) {
      // Add to miss queue for re-drill
      setMissQueue((prev) => [...prev, current]);
    }

    setLastCorrectAnswer(current.answer);
    setShowFeedback(correct ? "correct" : "wrong");

    setTimeout(() => {
      setShowFeedback(null);
      const nextIndex = currentIndex + 1;
      if (nextIndex < queue.length) {
        setCurrentIndex(nextIndex);
      } else if (missQueue.length > 0) {
        // Re-drill missed items
        const reshuffled = shuffleArray(missQueue);
        setQueue((prev) => [...prev, ...reshuffled]);
        setMissQueue([]);
        setCurrentIndex(nextIndex);
      } else {
        // Done
        const totalTime = Date.now() - sessionStart;
        const correctCount = newResults.filter((r) => r.correct).length;
        onComplete({
          results: newResults,
          totalTime,
          correctCount,
          totalCount: newResults.length,
          accuracy: Math.round((correctCount / newResults.length) * 100),
          avgTimeMs: Math.round(newResults.reduce((s, r) => s + r.timeMs, 0) / newResults.length),
        });
      }
    }, correct ? 600 : 1500);
  }, [current, currentIndex, queue, missQueue, results, questionStart, sessionStart, onComplete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || showFeedback) return;
    advance(userInput.trim());
  };

  const handleChoice = (choice: string) => {
    if (showFeedback) return;
    advance(choice);
  };

  if (!current) return null;

  const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs mono text-forge-text-dim">{answered}/{total}</span>
        <button onClick={onQuit} className="text-xs text-forge-text-muted hover:text-forge-danger transition-colors">
          Quit
        </button>
      </div>
      <div className="h-1.5 bg-forge-surface-2 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-forge-accent rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className={`bg-forge-surface border rounded-xl p-8 text-center mb-6 transition-colors duration-200 ${
        showFeedback === "correct" ? "border-forge-success/50 bg-forge-success/5" :
        showFeedback === "wrong" ? "border-forge-danger/50 bg-forge-danger/5" :
        "border-forge-border"
      }`}>
        <p className="text-xl font-semibold mono leading-relaxed">{current.prompt}</p>

        {showFeedback === "wrong" && (
          <p className="mt-4 text-sm text-forge-danger">
            Correct: <span className="mono font-bold text-forge-text">{lastCorrectAnswer}</span>
          </p>
        )}
        {showFeedback === "correct" && (
          <p className="mt-4 text-sm text-forge-success font-medium">Correct</p>
        )}
      </div>

      {/* Answer input */}
      {mode === "type" && !showFeedback && (
        <form onSubmit={handleSubmit}>
          <input aria-label="Type your answer"
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your answer..."
            autoComplete="off"
            className="w-full bg-forge-surface-2 border border-forge-border rounded-xl px-4 py-3 text-center mono text-lg outline-none focus:border-forge-accent/50 placeholder:text-forge-text-muted"
          />
          <button
            type="submit"
            disabled={!userInput.trim()}
            className="mt-3 w-full py-3 bg-forge-accent text-white rounded-xl font-medium disabled:opacity-50 hover:bg-forge-accent/90 transition-colors"
          >
            Submit
          </button>
        </form>
      )}

      {/* Multiple choice */}
      {mode === "choice" && !showFeedback && (
        <div className="grid grid-cols-2 gap-3">
          {choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleChoice(choice)}
              className="p-4 bg-forge-surface border border-forge-border rounded-xl text-sm mono hover:border-forge-accent/50 hover:bg-forge-accent/5 transition-colors text-center"
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {/* Miss count */}
      {missQueue.length > 0 && !showFeedback && (
        <p className="text-center text-xs text-forge-text-muted mt-4">
          {missQueue.length} missed item{missQueue.length !== 1 ? "s" : ""} queued for re-drill
        </p>
      )}
    </div>
  );
}
