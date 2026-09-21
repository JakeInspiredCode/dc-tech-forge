"use client";

import { useState, useCallback } from "react";
import { BOOT_STAGES, DEEP_DIVE_CARDS, type BootStage, type DeepDiveCard } from "@/lib/seeds/boot-process-data";
import BootL0 from "@/components/forge/boot-process/boot-l0";

type Level = "l0" | "l1" | "l2";

interface StageState {
  expanded: boolean;
  recallAttempted: boolean;
  recallCorrect: boolean;
}

export default function BootLearn({ onBack }: { onBack: () => void }) {
  const [level, setLevel] = useState<Level>("l0");

  if (level === "l0") {
    return <BootL0 onBack={onBack} onAdvance={() => setLevel("l1")} />;
  }

  return level === "l1"
    ? <L1Pipeline onBack={() => setLevel("l0")} onAdvance={() => setLevel("l2")} />
    : <L2DeepDive onBack={() => setLevel("l1")} />;
}

// ═══════════════════════════════════════
// L1 — Interactive Boot Pipeline
// ═══════════════════════════════════════

function L1Pipeline({ onBack, onAdvance }: { onBack: () => void; onAdvance: () => void }) {
  const [stageStates, setStageStates] = useState<Record<string, StageState>>(() =>
    Object.fromEntries(BOOT_STAGES.map((s) => [s.id, { expanded: false, recallAttempted: false, recallCorrect: false }]))
  );
  const [activeRecall, setActiveRecall] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const completedCount = BOOT_STAGES.filter((s) => stageStates[s.id].recallCorrect).length;
  const allComplete = completedCount === BOOT_STAGES.length;

  const toggleExpand = (id: string) => {
    setStageStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: !prev[id].expanded },
    }));
  };

  const startRecall = (id: string) => {
    setActiveRecall(id);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const submitRecall = useCallback((stageId: string, answer: string, stage: BootStage) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    const correct = answer === stage.recallAnswer;
    if (correct) {
      setStageStates((prev) => ({
        ...prev,
        [stageId]: { ...prev[stageId], recallAttempted: true, recallCorrect: true },
      }));
    } else {
      setStageStates((prev) => ({
        ...prev,
        [stageId]: { ...prev[stageId], recallAttempted: true },
      }));
    }
  }, []);

  const closeRecall = () => {
    setActiveRecall(null);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={onBack} className="text-xs text-v2-text-muted hover:text-v2-text transition-colors">&larr; Back to L0</button>
            <span className="text-xs text-v2-text-muted">/</span>
            <span className="text-xs text-v2-cyan mono font-semibold">L1 — Boot Sequence</span>
          </div>
          <p className="text-xs text-v2-text-dim">Click each stage to learn, then pass the recall check to unlock it.</p>
        </div>
        <div className="text-right">
          <div className="mono text-xs text-v2-text-muted">{completedCount}/{BOOT_STAGES.length} PASSED</div>
          <div className="h-1.5 w-24 bg-v2-bg-elevated rounded-full overflow-hidden mt-1">
            <div className="h-full bg-v2-success rounded-full transition-all duration-500" style={{ width: `${(completedCount / BOOT_STAGES.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Key insight banner */}
      <div className="bg-v2-bg-surface border border-v2-border rounded-lg px-4 py-3 mb-6">
        <p className="text-xs text-v2-text-dim italic">
          "The earlier the failure, the more likely it's hardware. The later the failure, the more likely it's configuration."
        </p>
      </div>

      {/* Pipeline stages */}
      <div className="space-y-0">
        {BOOT_STAGES.map((stage, i) => {
          const state = stageStates[stage.id];
          const isRecallActive = activeRecall === stage.id;
          const allChoices = [stage.recallAnswer, ...stage.recallDistractors].sort();

          return (
            <div key={stage.id}>
              {/* Connector line */}
              {i > 0 && (
                <div className="flex justify-center">
                  <div className={`w-px h-6 transition-colors duration-300 ${state.recallCorrect ? "bg-v2-success/40" : "bg-v2-border"}`} />
                </div>
              )}

              {/* Stage card */}
              <div
                className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                  state.recallCorrect
                    ? "border-v2-success/30 bg-v2-success/5"
                    : "border-v2-border bg-v2-bg-surface hover:border-v2-cyan/30"
                }`}
              >
                {/* Stage header — clickable */}
                <button
                  onClick={() => toggleExpand(stage.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  <span className="text-xl" style={{ color: stage.color }}>{stage.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: stage.color, background: `${stage.color}15`, border: `1px solid ${stage.color}30` }}>
                        STAGE {stage.order}
                      </span>
                      <span className="text-sm font-semibold truncate">{stage.name}</span>
                    </div>
                    <p className="text-xs text-v2-text-dim mt-0.5">{stage.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {state.recallCorrect && <span className="text-v2-success text-sm">&#10003;</span>}
                    <span className={`text-xs text-v2-text-muted transition-transform ${state.expanded ? "rotate-180" : ""}`}>&#9662;</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {state.expanded && (
                  <div className="px-5 pb-4 border-t border-v2-border/50">
                    <p className="text-sm text-v2-text leading-relaxed mt-3 mb-4">{stage.detail}</p>

                    {/* Recall section */}
                    {!state.recallCorrect && !isRecallActive && (
                      <button
                        onClick={() => startRecall(stage.id)}
                        className="w-full py-2.5 bg-v2-cyan/10 border border-v2-cyan/30 rounded-lg text-sm mono text-v2-cyan hover:bg-v2-cyan/15 transition-colors"
                      >
                        Test Your Recall &#8594;
                      </button>
                    )}

                    {isRecallActive && (
                      <div className="bg-v2-bg-elevated rounded-lg p-4 mt-1">
                        <p className="text-sm font-medium mb-3">{stage.recallQuestion}</p>
                        <div className="grid grid-cols-1 gap-2">
                          {allChoices.map((choice) => {
                            const isSelected = selectedAnswer === choice;
                            const isCorrect = choice === stage.recallAnswer;
                            let btnClass = "p-3 border rounded-lg text-sm mono text-left transition-colors ";
                            if (showResult && isSelected && isCorrect) {
                              btnClass += "border-v2-success/50 bg-v2-success/10 text-v2-success";
                            } else if (showResult && isSelected && !isCorrect) {
                              btnClass += "border-v2-danger/50 bg-v2-danger/10 text-v2-danger";
                            } else if (showResult && isCorrect) {
                              btnClass += "border-v2-success/30 bg-v2-success/5 text-v2-success";
                            } else {
                              btnClass += "border-v2-border bg-v2-bg-deep hover:border-v2-cyan/40 text-v2-text";
                            }
                            return (
                              <button
                                key={choice}
                                onClick={() => !showResult && submitRecall(stage.id, choice, stage)}
                                disabled={showResult}
                                className={btnClass}
                              >
                                {choice}
                              </button>
                            );
                          })}
                        </div>
                        {showResult && (
                          <div className="mt-3">
                            {selectedAnswer === stage.recallAnswer ? (
                              <div className="bg-v2-success/10 border border-v2-success/30 rounded-lg p-3">
                                <p className="text-sm text-v2-success font-medium">Correct — stage unlocked.</p>
                              </div>
                            ) : (
                              <div className="bg-v2-danger/10 border border-v2-danger/30 rounded-lg p-3">
                                <p className="text-sm text-v2-danger font-medium mb-1">Not quite.</p>
                                <p className="text-xs text-v2-text-dim">The answer is: <span className="text-v2-text mono">{stage.recallAnswer}</span></p>
                              </div>
                            )}
                            <button
                              onClick={closeRecall}
                              className="w-full mt-2 py-2 bg-v2-bg-surface border border-v2-border rounded-lg text-xs hover:border-v2-cyan/30 transition-colors"
                            >
                              {selectedAnswer === stage.recallAnswer ? "Continue" : "Re-read & Try Again"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {state.recallCorrect && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-v2-success">
                        <span>&#10003;</span>
                        <span>Recall passed</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advance to L2 */}
      {allComplete && (
        <div className="mt-6 text-center">
          <div className="bg-v2-success/10 border border-v2-success/30 rounded-xl p-6 mb-4">
            <p className="text-lg font-bold text-v2-success mb-1">L1 Complete</p>
            <p className="text-sm text-v2-text-dim">You know the boot sequence. Ready for senior-level depth?</p>
          </div>
          <button
            onClick={onAdvance}
            className="px-8 py-3 bg-v2-cyan text-v2-bg-deep rounded-xl font-semibold hover:bg-v2-cyan-bright transition-colors"
          >
            Enter L2 — Deep Dive &#8594;
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// L2 — Deep Dive Flip Cards
// ═══════════════════════════════════════

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  tools: { label: "TOOLS", color: "#3b82f6" },
  failure: { label: "FAILURE MODE", color: "#ef4444" },
  recovery: { label: "RECOVERY", color: "#22c55e" },
  concept: { label: "CONCEPT", color: "#a855f7" },
};

function L2DeepDive({ onBack }: { onBack: () => void }) {
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [selfGrades, setSelfGrades] = useState<Record<string, "knew" | "missed">>({}); 

  const toggleFlip = (cardId: string) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId); else next.add(cardId);
      return next;
    });
  };

  const gradeCard = (cardId: string, grade: "knew" | "missed") => {
    setSelfGrades((prev) => ({ ...prev, [cardId]: grade }));
  };

  const stageCards = activeStage ? DEEP_DIVE_CARDS.filter((c) => c.stageId === activeStage) : [];
  const stageInfo = activeStage ? BOOT_STAGES.find((s) => s.id === activeStage) : null;

  // Stage selection view
  if (!activeStage) {
    const stageProgress = BOOT_STAGES.map((stage) => {
      const cards = DEEP_DIVE_CARDS.filter((c) => c.stageId === stage.id);
      const graded = cards.filter((c) => selfGrades[c.id]);
      const knew = cards.filter((c) => selfGrades[c.id] === "knew");
      return { stage, total: cards.length, graded: graded.length, knew: knew.length };
    });

    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} className="text-xs text-v2-text-muted hover:text-v2-text transition-colors">&larr; Back to L1</button>
          <span className="text-xs text-v2-text-muted">/</span>
          <span className="text-xs text-purple-400 mono font-semibold">L2 — Deep Dive</span>
        </div>
        <p className="text-xs text-v2-text-dim mb-6">Senior tech depth — tools, failure modes, recovery, and concepts. Flip each card to test recall, then self-grade.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stageProgress.map(({ stage, total, graded, knew }) => (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className="rounded-xl p-5 border border-v2-border bg-v2-bg-surface hover:border-v2-cyan/30 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg" style={{ color: stage.color }}>{stage.icon}</span>
                <span className="font-semibold text-sm" style={{ color: stage.color }}>{stage.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-v2-text-muted">
                <span>{total} cards</span>
                {graded > 0 && (
                  <>
                    <span className="text-v2-text-muted">|</span>
                    <span className="text-v2-success">{knew} knew</span>
                    <span className="text-v2-danger">{graded - knew} missed</span>
                  </>
                )}
              </div>
              {graded > 0 && (
                <div className="h-1 bg-v2-bg-elevated rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-v2-success rounded-full transition-all" style={{ width: `${(knew / total) * 100}%` }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Card drill view for a specific stage
  const gradedCount = stageCards.filter((c) => selfGrades[c.id]).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveStage(null)} className="text-xs text-v2-text-muted hover:text-v2-text transition-colors">&larr; Stages</button>
          <span className="text-xs text-v2-text-muted">/</span>
          <span className="text-xs mono font-semibold" style={{ color: stageInfo?.color }}>{stageInfo?.name}</span>
        </div>
        <span className="mono text-xs text-v2-text-muted">{gradedCount}/{stageCards.length} graded</span>
      </div>

      <div className="space-y-4">
        {stageCards.map((card) => {
          const isFlipped = flippedCards.has(card.id);
          const grade = selfGrades[card.id];
          const cat = CATEGORY_LABELS[card.category];

          return (
            <div key={card.id} className={`border rounded-xl overflow-hidden transition-colors ${
              grade === "knew" ? "border-v2-success/30 bg-v2-success/5"
              : grade === "missed" ? "border-v2-danger/30 bg-v2-danger/5"
              : "border-v2-border bg-v2-bg-surface"
            }`}>
              {/* Card header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-v2-border/50">
                <span className="text-xs font-medium text-v2-text-dim">{card.topic}</span>
                <span className="mono text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}>
                  {cat.label}
                </span>
              </div>

              {/* Front — question */}
              <div className="px-5 py-4">
                <p className="text-sm font-medium leading-relaxed">{card.front}</p>
              </div>

              {/* Flip trigger or answer */}
              {!isFlipped ? (
                <div className="px-5 pb-4">
                  <button
                    onClick={() => toggleFlip(card.id)}
                    className="w-full py-2.5 bg-v2-bg-elevated border border-v2-border rounded-lg text-sm mono hover:border-v2-cyan/40 transition-colors"
                  >
                    Reveal Answer
                  </button>
                </div>
              ) : (
                <div className="px-5 pb-4 space-y-3">
                  <div className="bg-v2-bg-deep border border-v2-border rounded-lg p-4">
                    <p className="text-sm text-v2-text leading-relaxed">{card.back}</p>
                  </div>
                  {!grade && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => gradeCard(card.id, "knew")}
                        className="flex-1 py-2 bg-v2-success/10 border border-v2-success/30 rounded-lg text-sm text-v2-success font-medium hover:bg-v2-success/15 transition-colors"
                      >
                        Knew It
                      </button>
                      <button
                        onClick={() => gradeCard(card.id, "missed")}
                        className="flex-1 py-2 bg-v2-danger/10 border border-v2-danger/30 rounded-lg text-sm text-v2-danger font-medium hover:bg-v2-danger/15 transition-colors"
                      >
                        Missed It
                      </button>
                    </div>
                  )}
                  {grade && (
                    <div className={`text-xs mono ${grade === "knew" ? "text-v2-success" : "text-v2-danger"}`}>
                      {grade === "knew" ? "&#10003; Marked as known" : "&#10007; Marked for review"}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
