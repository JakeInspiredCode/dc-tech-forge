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
      className="w-full text-left bg-v2-bg-surface border border-v2-border rounded-xl p-4 hover:border-v2-cyan/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <code className="text-base font-semibold mono text-v2-text">{fs.name}</code>
          <span className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full ${cat.bg} ${cat.color} ${cat.border} border`}>
            {cat.label}
          </span>
        </div>
        <span className="text-v2-text-muted text-xs">{expanded ? "▾" : "▸"}</span>
      </div>
      <p className="text-sm text-v2-text-dim">{fs.description}</p>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 space-y-3 text-sm" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-v2-text-muted mono">{fs.fullName}</p>

          <div>
            <p className="text-[10px] uppercase text-v2-text-muted font-semibold tracking-wider mb-1">Use Cases</p>
            <ul className="space-y-0.5">
              {fs.useCases.map((u, i) => (
                <li key={i} className="text-v2-text-dim pl-3 relative before:content-['›'] before:absolute before:left-0 before:text-v2-cyan">{u}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase text-v2-text-muted font-semibold tracking-wider mb-1">Key Characteristics</p>
            <ul className="space-y-0.5">
              {fs.characteristics.map((c, i) => (
                <li key={i} className="text-v2-text-dim pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-v2-text-muted">{c}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-6">
            <div>
              <p className="text-[10px] uppercase text-v2-text-muted font-semibold tracking-wider mb-1">Common Mounts</p>
              <div className="flex flex-wrap gap-1">
                {fs.mountPoints.map((m, i) => (
                  <code key={i} className="text-xs mono bg-v2-bg-elevated px-2 py-0.5 rounded text-v2-text-dim">{m}</code>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-v2-text-muted font-semibold tracking-wider mb-1">Commands</p>
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
              ? "bg-v2-cyan/20 text-v2-cyan border-v2-cyan/40"
              : "border-v2-border text-v2-text-dim hover:border-v2-cyan/20"
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
                  : "border-v2-border text-v2-text-dim hover:border-v2-cyan/20"
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
        <p className="text-v2-text-dim text-sm">
          {score.correct}/{score.total} correct
        </p>
        <p className="text-sm text-v2-text-dim">
          {pct === 100 ? "Perfect run." : pct >= 75 ? "Solid. Keep drilling the ones you missed." : "Review the Learn tab, then try again."}
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-2.5 bg-v2-cyan text-v2-bg-deep rounded-xl text-sm font-medium hover:bg-v2-cyan-bright transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-v2-text-muted">
        <span className="mono">{index + 1}/{quizzes.length}</span>
        <span className="mono">{score.correct}/{score.total} correct</span>
      </div>
      <div className="h-1.5 bg-v2-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-v2-cyan rounded-full transition-all duration-300"
          style={{ width: `${(index / quizzes.length) * 100}%` }}
        />
      </div>

      {/* Scenario */}
      <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-6">
        <p className="text-[10px] uppercase text-v2-text-muted font-semibold tracking-wider mb-2">Scenario</p>
        <p className="text-base leading-relaxed">{quiz.scenario}</p>
      </div>

      {/* Choices */}
      {phase === "choose" && (
        <div className="grid grid-cols-2 gap-2">
          {choices.map((name) => (
            <button
              key={name}
              onClick={() => handleChoice(name)}
              className="p-3 bg-v2-bg-surface border border-v2-border rounded-lg text-sm mono text-left hover:border-v2-cyan/40 hover:bg-v2-cyan/5 transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Correct */}
      {phase === "correct" && (
        <div className="space-y-3">
          <div className="bg-v2-success/10 border border-v2-success/30 rounded-lg p-4">
            <p className="text-sm text-v2-success font-medium">
              Correct — <span className="mono">{quiz.answer}</span>
            </p>
            <p className="text-xs text-v2-text-dim mt-1">{quiz.teaching}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex-1 py-3 bg-v2-bg-elevated border border-v2-border rounded-xl text-sm font-medium hover:border-v2-cyan/40 transition-colors"
            >
              Practice Again
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-v2-cyan text-v2-bg-deep rounded-xl font-medium hover:bg-v2-cyan-bright transition-colors"
            >
              {isLast ? "See Score" : "Next →"}
            </button>
          </div>
        </div>
      )}

      {/* Wrong */}
      {phase === "wrong" && (
        <div className="space-y-3">
          <div className="bg-v2-danger/10 border border-v2-danger/30 rounded-lg p-4">
            <p className="text-sm text-v2-danger font-medium">
              Not quite — you picked <span className="mono">{selected}</span>, answer is <span className="mono">{quiz.answer}</span>
            </p>
            <p className="text-xs text-v2-text-dim mt-1">{quiz.teaching}</p>
          </div>
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-v2-bg-elevated border border-v2-border rounded-xl text-sm font-medium hover:border-v2-cyan/40 transition-colors"
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
                ? "bg-v2-cyan/20 text-v2-cyan border-v2-cyan/40"
                : "border-v2-border text-v2-text-dim hover:border-v2-cyan/20"
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
