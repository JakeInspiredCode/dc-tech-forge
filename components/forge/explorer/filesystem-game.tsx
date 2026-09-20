"use client";

import { useState, useCallback, useMemo } from "react";
import { FSNode, FILESYSTEM_TREE, getQuizNodes, type FSDifficulty } from "@/lib/seeds/filesystem-data";

type Mode = "learn" | "label";

interface Props {
  mode: Mode;
  onBack: () => void;
  /** Called when the navigation exercise is finished. Defaults to onBack. */
  onComplete?: () => void;
  /** Cap the navigation exercise to this many questions. Omit for all. */
  maxQuestions?: number;
  /** Lock to a specific difficulty (used by mission steps). Omit for user-selectable. */
  difficulty?: FSDifficulty;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Learn Mode: interactive expandable tree ──

interface TreeNodeProps {
  node: FSNode;
  depth: number;
  hideDescriptions?: boolean;
  /** Select a node (does NOT score — just highlights it) */
  onSelectNode?: (path: string) => void;
  selectedPath?: string | null;
  flashPath?: string | null;
  flashType?: "correct" | "wrong" | null;
}

function TreeNode({ node, depth, hideDescriptions, onSelectNode, selectedPath, flashPath, flashType }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  const isFlashing = flashPath === node.path;
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (onSelectNode) {
      // In exercise mode: parent dirs expand/collapse freely, selecting happens on any click
      if (hasChildren) {
        setExpanded(!expanded);
      }
      // Select this node regardless (user can confirm separately)
      onSelectNode(node.path);
    } else if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  // Color differentiation: parent dirs = cyan, leaf nodes = dimmer
  const nameColor = hasChildren
    ? "text-v2-cyan"
    : "text-v2-text-dim";

  // Flash feedback colors
  const flashBg = isFlashing
    ? flashType === "correct"
      ? "bg-v2-success/15 ring-1 ring-v2-success/40"
      : "bg-v2-danger/15 ring-1 ring-v2-danger/40"
    : isSelected
    ? "bg-v2-cyan/10 ring-1 ring-v2-cyan/40"
    : "";

  return (
    <div style={{ marginLeft: depth * 10 }}>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1 py-[1px] px-1 rounded text-left w-full hover:bg-v2-bg-elevated transition-all duration-150 ${
          hasChildren ? "cursor-pointer" : onSelectNode ? "cursor-pointer" : "cursor-default"
        } ${flashBg}`}
      >
        <span className={`text-[9px] w-3 text-center leading-none ${hasChildren ? "text-v2-cyan/50" : "text-v2-text-muted"}`}>
          {hasChildren ? (expanded ? "▾" : "▸") : "·"}
        </span>
        <span className={`mono text-[11px] leading-tight ${nameColor}`}>
          {node.name === "/" ? "/" : node.name}
        </span>
        {!hideDescriptions && (
          <span className="text-[9px] leading-tight text-v2-text-muted truncate">{node.description}</span>
        )}
      </button>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              hideDescriptions={hideDescriptions}
              onSelectNode={onSelectNode}
              selectedPath={selectedPath}
              flashPath={flashPath}
              flashType={flashType}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Label Mode: description shown, type the path ──
function LabelGame({ onBack }: { onBack: () => void }) {
  const [quizItems] = useState(() => shuffleArray(getQuizNodes()));
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const item = quizItems[current];
  const isDone = current >= quizItems.length;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!item || feedback) return;
    const norm = input.trim().toLowerCase().replace(/\/+$/, "");
    const target = item.path.toLowerCase().replace(/\/+$/, "");
    const isCorrect = norm === target;

    setFeedback(isCorrect ? "correct" : "wrong");
    setCorrectAnswer(item.path);
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));

    setTimeout(() => {
      setFeedback(null);
      setInput("");
      setCurrent((c) => c + 1);
    }, isCorrect ? 800 : 2000);
  }, [item, input, feedback]);

  if (isDone) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-bold mono mb-2">Done!</h3>
        <p className="text-v2-text-dim mb-4">
          {score.correct}/{score.total} correct ({score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%)
        </p>
        <button onClick={onBack} className="px-6 py-2 bg-v2-cyan text-v2-bg-deep rounded-xl font-medium">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs mono text-v2-text-dim">{current + 1}/{quizItems.length}</span>
        <span className="text-xs mono text-v2-cyan">{score.correct} correct</span>
      </div>

      <div className={`bg-v2-bg-surface border rounded-xl p-6 text-center mb-4 transition-colors ${
        feedback === "correct" ? "border-v2-success/50" :
        feedback === "wrong" ? "border-v2-danger/50" :
        "border-v2-border"
      }`}>
        <p className="text-sm text-v2-text-dim mb-2">What path is this?</p>
        <p className="text-lg font-medium">{item.description}</p>
        {feedback === "wrong" && (
          <p className="mt-3 text-sm text-v2-danger">
            Correct: <span className="mono text-v2-text">{correctAnswer}</span>
          </p>
        )}
      </div>

      {!feedback && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="/path/to/..."
            autoFocus
            autoComplete="off"
            className="w-full bg-v2-bg-elevated border border-v2-border rounded-xl px-4 py-3 mono text-center outline-none focus:border-v2-cyan/50"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="mt-3 w-full py-3 bg-v2-cyan text-v2-bg-deep rounded-xl font-medium disabled:opacity-30"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
}

// ── Navigate Exercise: find the directory by its description ──

function NavigateExercise({ onEnd, maxQuestions, difficulty }: { onEnd: () => void; maxQuestions?: number; difficulty?: FSDifficulty }) {
  const targets = useMemo(() => {
    const all = shuffleArray(getQuizNodes(difficulty));
    return maxQuestions ? all.slice(0, maxQuestions) : all;
  }, [maxQuestions, difficulty]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [flashPath, setFlashPath] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<"correct" | "wrong" | null>(null);
  const [revealAnswer, setRevealAnswer] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const target = targets[current];
  const isDone = current >= targets.length;

  // Clicking a node just selects it — no scoring yet
  const handleSelectNode = useCallback((path: string) => {
    if (locked) return;
    setSelectedPath(path);
  }, [locked]);

  // Confirm button scores the selected answer
  const handleConfirm = useCallback(() => {
    if (locked || !selectedPath || !target) return;
    setLocked(true);

    const isCorrect = selectedPath.toLowerCase() === target.path.toLowerCase();

    setFlashPath(selectedPath);
    setFlashType(isCorrect ? "correct" : "wrong");
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));

    if (!isCorrect) {
      setRevealAnswer(target.path);
    }

    setTimeout(() => {
      if (!isCorrect) {
        // Flash the correct answer
        setFlashPath(target.path);
        setFlashType("correct");
        setTimeout(() => {
          setFlashPath(null);
          setFlashType(null);
          setRevealAnswer(null);
          setSelectedPath(null);
          setLocked(false);
          setCurrent((c) => c + 1);
        }, 1200);
      } else {
        setFlashPath(null);
        setFlashType(null);
        setSelectedPath(null);
        setLocked(false);
        setCurrent((c) => c + 1);
      }
    }, isCorrect ? 600 : 1000);
  }, [locked, selectedPath, target]);

  if (isDone) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="text-center py-12">
        <h3
          className="display-font text-2xl tracking-wider mb-2"
          style={{ color: pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444" }}
        >
          {pct >= 90 ? "Outstanding!" : pct >= 70 ? "Solid Work" : "Keep Practicing"}
        </h3>
        <p className="text-v2-text-dim mb-1 telemetry-font text-lg">
          {score.correct} / {score.total}
        </p>
        <p className="text-v2-text-muted text-sm mb-4">{pct}% accuracy</p>
        {maxQuestions && (
          <p className="text-v2-text-muted text-[11px] mb-5">
            This was a quick round — the full navigation exercise with all directories is available in the <span className="text-v2-cyan">Arsenal</span>.
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setCurrent(0);
              setScore({ correct: 0, total: 0 });
            }}
            className="px-5 py-2 text-sm rounded border border-v2-cyan/30 text-v2-cyan hover:bg-v2-cyan/10 transition-colors"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            Retry
          </button>
          <button
            onClick={onEnd}
            className="px-5 py-2 text-sm rounded bg-v2-cyan text-v2-bg-deep font-medium hover:bg-v2-cyan-bright transition-colors"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Target prompt */}
      <div
        className="mb-4 px-4 py-3 rounded-lg text-center"
        style={{
          background: "rgba(6, 214, 214, 0.06)",
          border: "1px solid rgba(6, 214, 214, 0.2)",
        }}
      >
        <div className="text-[10px] uppercase tracking-widest text-v2-text-muted mb-1"
          style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
          Find the directory
        </div>
        <div className="text-base font-medium text-v2-text">
          {target.description}
        </div>
      </div>

      {/* Progress + Score */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs telemetry-font text-v2-text-muted">
          {current + 1} / {targets.length}
        </span>
        <span className="text-xs telemetry-font text-v2-cyan">
          {score.correct} correct
        </span>
      </div>

      {/* Wrong answer reveal */}
      {revealAnswer && (
        <div className="mb-3 px-3 py-2 rounded text-center text-sm"
          style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <span className="text-v2-danger">Correct answer: </span>
          <span className="mono text-v2-text">{revealAnswer}</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="flex gap-0.5 mb-4">
        {targets.slice(0, Math.min(targets.length, 50)).map((_, i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full transition-colors duration-300"
            style={{
              background: i < current
                ? "#06d6d6"
                : i === current
                ? "rgba(6, 214, 214, 0.4)"
                : "rgba(30, 34, 51, 0.5)",
            }}
          />
        ))}
      </div>

      {/* Selected answer + Confirm button */}
      {selectedPath && !locked && (
        <div className="mb-3 flex items-center justify-between px-3 py-2 rounded-lg"
          style={{ background: "rgba(6, 214, 214, 0.06)", border: "1px solid rgba(6, 214, 214, 0.2)" }}>
          <span className="text-xs text-v2-text-dim">
            Selected: <span className="mono text-v2-cyan">{selectedPath}</span>
          </span>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 text-[11px] font-semibold rounded tracking-wider uppercase
              bg-v2-cyan text-v2-bg-deep hover:bg-v2-cyan-bright transition-colors"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            Confirm
          </button>
        </div>
      )}

      {/* Tree with hidden descriptions */}
      <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-4 overflow-auto max-h-[55vh]">
        <TreeNode
          node={FILESYSTEM_TREE}
          depth={0}
          hideDescriptions
          onSelectNode={handleSelectNode}
          selectedPath={selectedPath}
          flashPath={flashPath}
          flashType={flashType}
        />
      </div>
    </div>
  );
}


// ── Main Component ──

const DIFFICULTY_OPTIONS: { value: FSDifficulty; label: string; color: string }[] = [
  { value: "easy", label: "Easy", color: "#22c55e" },
  { value: "moderate", label: "Moderate", color: "#f59e0b" },
  { value: "hard", label: "Hard", color: "#ef4444" },
];

export default function FilesystemGame({ mode, onBack, onComplete, maxQuestions, difficulty: fixedDifficulty }: Props) {
  const [exerciseActive, setExerciseActive] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<FSDifficulty | undefined>(fixedDifficulty);

  if (mode === "label") {
    return <LabelGame onBack={onBack} />;
  }

  // Learn mode with optional navigation exercise
  if (exerciseActive) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="display-font text-sm tracking-wider text-v2-cyan">
            Navigation Exercise
            {selectedDifficulty && (
              <span
                className="ml-2 text-[10px] px-2 py-0.5 rounded"
                style={{
                  color: DIFFICULTY_OPTIONS.find((d) => d.value === selectedDifficulty)?.color,
                  background: `${DIFFICULTY_OPTIONS.find((d) => d.value === selectedDifficulty)?.color}15`,
                  border: `1px solid ${DIFFICULTY_OPTIONS.find((d) => d.value === selectedDifficulty)?.color}30`,
                }}
              >
                {selectedDifficulty}
              </span>
            )}
          </h3>
          <button
            onClick={() => setExerciseActive(false)}
            className="text-xs text-v2-text-muted hover:text-v2-text transition-colors"
          >
            ← Back to reference
          </button>
        </div>
        <NavigateExercise
          onEnd={onComplete ?? onBack}
          maxQuestions={maxQuestions}
          difficulty={selectedDifficulty}
        />
      </div>
    );
  }

  // Difficulty picker (only shown in Arsenal — missions pass fixedDifficulty)
  const showDifficultyPicker = !fixedDifficulty;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Linux Filesystem Hierarchy</h3>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-xs text-v2-text-muted hover:text-v2-text transition-colors">
            Back
          </button>
        </div>
      </div>
      <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-4 overflow-auto max-h-[60vh]">
        <TreeNode node={FILESYSTEM_TREE} depth={0} />
      </div>

      {/* Navigation exercise launcher */}
      <div className="mt-4 p-4 rounded-lg" style={{ background: "rgba(6, 214, 214, 0.04)", border: "1px solid rgba(6, 214, 214, 0.15)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-v2-text">Navigation Exercise</h4>
            <p className="text-[11px] text-v2-text-muted mt-0.5">
              {showDifficultyPicker
                ? "Test your knowledge — select a difficulty and start"
                : "Find each directory by its description"}
            </p>
          </div>
          <button
            onClick={() => {
              if (!showDifficultyPicker) {
                setExerciseActive(true);
              } else if (selectedDifficulty) {
                setExerciseActive(true);
              }
            }}
            disabled={showDifficultyPicker && !selectedDifficulty}
            className="px-4 py-1.5 text-[11px] font-semibold rounded tracking-wider uppercase
              bg-v2-cyan/10 text-v2-cyan border border-v2-cyan/30
              hover:bg-v2-cyan/20 hover:border-v2-cyan/50 transition-all
              disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            Start
          </button>
        </div>

        {showDifficultyPicker && (
          <div className="flex gap-2 mt-3">
            {DIFFICULTY_OPTIONS.map((opt) => {
              const count = getQuizNodes(opt.value).length;
              const isSelected = selectedDifficulty === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedDifficulty(opt.value)}
                  className="flex-1 py-2 px-3 rounded text-xs font-medium transition-all"
                  style={{
                    background: isSelected ? `${opt.color}15` : "transparent",
                    border: `1px solid ${isSelected ? opt.color + "60" : "rgba(30, 34, 51, 0.5)"}`,
                    color: isSelected ? opt.color : "#7a8298",
                    fontFamily: "'Chakra Petch', sans-serif",
                  }}
                >
                  {opt.label}
                  <span className="block text-[10px] opacity-60 mt-0.5">{count} questions</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
