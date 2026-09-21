"use client";

import { useState, useMemo, useCallback } from "react";
import {
  FILESYSTEM_TYPES,
  FS_TYPE_QUIZZES,
  CATEGORY_META,
  type FilesystemType,
  type FSTypeQuiz,
} from "@/lib/seeds/filesystem-types";

// ═══════════════════════════════════════
// LEARN MODE — Expandable Reference Cards
// ═══════════════════════════════════════

function LearnCard({ fs }: { fs: FilesystemType }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_META[fs.category];

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left bg-forge-surface border border-forge-border rounded-xl p-4 hover:border-forge-accent/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <code className="text-base font-semibold mono text-forge-text">{fs.name}</code>
          <span className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full ${cat.bg} ${cat.color} ${cat.border} border`}>
            {cat.label}
          </span>
        </div>
        <span className="text-forge-text-muted text-xs">{expanded ? "▾" : "▸"}</span>
      </div>
      <p className="text-sm text-forge-text-dim">{fs.description}</p>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 space-y-3 text-sm" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-forge-text-muted mono">{fs.fullName}</p>

          <div>
            <p className="text-[10px] uppercase text-forge-text-muted font-semibold tracking-wider mb-1">Use Cases</p>
            <ul className="space-y-0.5">
              {fs.useCases.map((u, i) => (
                <li key={i} className="text-forge-text-dim pl-3 relative before:content-['›'] before:absolute before:left-0 before:text-forge-accent-text">{u}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase text-forge-text-muted font-semibold tracking-wider mb-1">Key Characteristics</p>
            <ul className="space-y-0.5">
              {fs.characteristics.map((c, i) => (
                <li key={i} className="text-forge-text-dim pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-forge-text-muted">{c}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-6">
            <div>
              <p className="text-[10px] uppercase text-forge-text-muted font-semibold tracking-wider mb-1">Common Mounts</p>
              <div className="flex flex-wrap gap-1">
                {fs.mountPoints.map((m, i) => (
                  <code key={i} className="text-xs mono bg-forge-surface-2 px-2 py-0.5 rounded text-forge-text-dim">{m}</code>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-forge-text-muted font-semibold tracking-wider mb-1">Commands</p>
              <div className="flex flex-wrap gap-1">
                {fs.commands.map((cmd, i) => (
                  <code key={i} className="text-xs mono bg-[#0d1117] px-2 py-0.5 rounded text-emerald-400">{cmd}</code>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

function LearnMode() {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? FILESYSTEM_TYPES : FILESYSTEM_TYPES.filter((f) => f.category === filter);

  return (
    <div className="space-y-3">
      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs mono border transition-colors ${
            filter === "all"
              ? "bg-forge-accent/20 text-forge-accent-text border-forge-accent/40"
              : "border-forge-border text-forge-text-dim hover:border-forge-accent/20"
          }`}
        >
          All ({FILESYSTEM_TYPES.length})
        </button>
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const count = FILESYSTEM_TYPES.filter((f) => f.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs mono border transition-colors ${
                filter === key
                  ? `${meta.bg} ${meta.color} ${meta.border}`
                  : "border-forge-border text-forge-text-dim hover:border-forge-accent/20"
              }`}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {filtered.map((fs) => (
          <LearnCard key={fs.name} fs={fs} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// QUIZ MODE — Identify the Filesystem
// ═══════════════════════════════════════

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuizMode() {
  const [quizzes] = useState(() => shuffle(FS_TYPE_QUIZZES));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<"choose" | "correct" | "wrong">("choose");
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const quiz = quizzes[index];
  const isLast = index === quizzes.length - 1;
  const [done, setDone] = useState(false);

  // Build 4 choices: correct answer + 3 random distractors
  const choices = useMemo(() => {
    const others = FILESYSTEM_TYPES.filter((f) => f.name !== quiz?.answer);
    const distractors = shuffle(others).slice(0, 3).map((f) => f.name);
    return shuffle([quiz?.answer, ...distractors]);
  }, [quiz]);

  const handleChoice = useCallback(
    (name: string) => {
      if (phase !== "choose") return;
      setSelected(name);
      if (name === quiz.answer) {
        setPhase("correct");
        setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
      } else {
        setPhase("wrong");
        setScore((s) => ({ ...s, total: s.total + 1 }));
      }
    },
    [phase, quiz]
  );

  const handleNext = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setPhase("choose");
  };

  const handleRetry = () => {
    setSelected(null);
    setPhase("choose");
  };

  const handleRestart = () => {
    setIndex(0);
    setSelected(null);
    setPhase("choose");
    setScore({ correct: 0, total: 0 });
    setDone(false);
  };

  if (!quiz) return null;

  // Final score screen
  if (done) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-4xl font-bold">{pct}%</p>
        <p className="text-forge-text-dim text-sm">
          {score.correct}/{score.total} correct
        </p>
        <p className="text-sm text-forge-text-dim">
          {pct === 100 ? "Perfect run." : pct >= 75 ? "Solid. Keep drilling the ones you missed." : "Review the Learn tab, then try again."}
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-2.5 bg-forge-accent text-white rounded-xl text-sm font-medium hover:bg-forge-accent/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-forge-text-muted">
        <span className="mono">{index + 1}/{quizzes.length}</span>
        <span className="mono">{score.correct}/{score.total} correct</span>
      </div>
      <div className="h-1.5 bg-forge-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-forge-accent rounded-full transition-all duration-300"
          style={{ width: `${(index / quizzes.length) * 100}%` }}
        />
      </div>

      {/* Scenario */}
      <div className="bg-forge-surface border border-forge-border rounded-xl p-6">
        <p className="text-[10px] uppercase text-forge-text-muted font-semibold tracking-wider mb-2">Scenario</p>
        <p className="text-base leading-relaxed">{quiz.scenario}</p>
      </div>

      {/* Choices */}
      {phase === "choose" && (
        <div className="grid grid-cols-2 gap-2">
          {choices.map((name) => (
            <button
              key={name}
              onClick={() => handleChoice(name)}
              className="p-3 bg-forge-surface border border-forge-border rounded-lg text-sm mono text-left hover:border-forge-accent/40 hover:bg-forge-accent/5 transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Correct */}
      {phase === "correct" && (
        <div className="space-y-3">
          <div className="bg-forge-success/10 border border-forge-success/30 rounded-lg p-4">
            <p className="text-sm text-forge-success font-medium">
              Correct — <span className="mono">{quiz.answer}</span>
            </p>
            <p className="text-xs text-forge-text-dim mt-1">{quiz.teaching}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex-1 py-3 bg-forge-surface-2 border border-forge-border rounded-xl text-sm font-medium hover:border-forge-accent/40 transition-colors"
            >
              Practice Again
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-forge-accent text-white rounded-xl font-medium hover:bg-forge-accent/90 transition-colors"
            >
              {isLast ? "See Score" : "Next →"}
            </button>
          </div>
        </div>
      )}

      {/* Wrong */}
      {phase === "wrong" && (
        <div className="space-y-3">
          <div className="bg-forge-danger/10 border border-forge-danger/30 rounded-lg p-4">
            <p className="text-sm text-forge-danger font-medium">
              Not quite — you picked <span className="mono">{selected}</span>, answer is <span className="mono">{quiz.answer}</span>
            </p>
            <p className="text-xs text-forge-text-dim mt-1">{quiz.teaching}</p>
          </div>
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-forge-surface-2 border border-forge-border rounded-xl text-sm font-medium hover:border-forge-accent/40 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN EXPORT — Learn / Quiz Toggle
// ═══════════════════════════════════════

export default function FilesystemTypes({ defaultMode = "learn" }: { defaultMode?: "learn" | "quiz" } = {}) {
  const [mode, setMode] = useState<"learn" | "quiz">(defaultMode);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["learn", "quiz"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm mono border transition-colors ${
              mode === m
                ? "bg-forge-accent/20 text-forge-accent-text border-forge-accent/40"
                : "border-forge-border text-forge-text-dim hover:border-forge-accent/20"
            }`}
          >
            {m === "learn" ? "📖 Learn" : "🎯 Quiz"}
          </button>
        ))}
      </div>

      {mode === "learn" ? <LearnMode /> : <QuizMode />}
    </div>
  );
}
