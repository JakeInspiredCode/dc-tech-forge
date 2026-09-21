"use client";

import { useState, useCallback } from "react";
import { BOOT_LAYERS, L0_RECALL_QUIZ, type BootLayer, type BootLayerStep, type L0RecallQuestion } from "@/lib/seeds/boot-l0-data";

// ═══════════════════════════════════════
// L0 — The Mental Model
// ═══════════════════════════════════════

type Phase = "explore" | "quiz" | "complete";

export default function BootL0({ onBack, onAdvance }: { onBack: () => void; onAdvance: () => void }) {
  const [phase, setPhase] = useState<Phase>("explore");
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [revealedSteps, setRevealedSteps] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const allStepsRevealed = revealedSteps.size >= 6;
  const correctCount = L0_RECALL_QUIZ.filter((q) => quizAnswers[q.id] === q.correctAnswer).length;
  const quizPassed = correctCount >= 4;

  const toggleLayer = (id: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const revealStep = (stepNum: number) => {
    setRevealedSteps((prev) => new Set(prev).add(stepNum));
  };

  const selectAnswer = useCallback((questionId: string, answer: string) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, [quizSubmitted]);

  const submitQuiz = () => setQuizSubmitted(true);
  const resetQuiz = () => { setQuizAnswers({}); setQuizSubmitted(false); };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={onBack} className="text-xs text-v2-text-muted hover:text-v2-text transition-colors">&larr; Back</button>
            <span className="text-xs text-v2-text-muted">/</span>
            <span className="text-xs text-orange-400 mono font-semibold">L0 — The Mental Model</span>
          </div>
          <p className="text-xs text-v2-text-dim">
            {phase === "explore"
              ? "Expand each layer. Reveal each step. Understand the question it answers."
              : phase === "quiz"
              ? "Prove you've got the model locked in."
              : "Mental model locked. Ready for the 6-stage deep dive."}
          </p>
        </div>
        <div className="text-right">
          <div className="mono text-xs text-v2-text-muted">{revealedSteps.size}/6 REVEALED</div>
          <div className="h-1.5 w-24 bg-v2-bg-elevated rounded-full overflow-hidden mt-1">
            <div className="h-full bg-v2-cyan rounded-full transition-all duration-500" style={{ width: `${(revealedSteps.size / 6) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Key insight */}
      <div className="bg-v2-bg-surface border border-v2-border rounded-lg px-4 py-3 mb-6">
        <p className="text-xs text-v2-text-dim">
          <span className="text-v2-text font-medium">Three layers. Two steps each. Strict order.</span>{" "}
          Each step must answer its question before the next step can begin.
        </p>
      </div>

      {/* ── 3-Layer Interactive Diagram ── */}
      {(phase === "explore" || phase === "quiz") && (
        <div className="space-y-3 mb-6">
          {BOOT_LAYERS.map((layer, layerIdx) => (
            <LayerCard
              key={layer.id}
              layer={layer}
              expanded={expandedLayers.has(layer.id)}
              revealedSteps={revealedSteps}
              onToggle={() => toggleLayer(layer.id)}
              onReveal={revealStep}
              showConnector={layerIdx < BOOT_LAYERS.length - 1}
            />
          ))}
        </div>
      )}

      {/* Failure gradient callout */}
      {phase === "explore" && (
        <div className="rounded-xl border border-v2-border bg-v2-bg-surface overflow-hidden mb-6">
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(to right, #f97316, #f59e0b, #22c55e)" }} />
          <div className="px-4 py-3 flex justify-between text-[10px] mono text-v2-text-muted">
            <span>Failures early = replace parts</span>
            <span>Failures middle = fix drivers</span>
            <span>Failures late = fix config</span>
          </div>
        </div>
      )}

      {/* Gate to quiz */}
      {phase === "explore" && allStepsRevealed && (
        <div className="text-center">
          <button
            onClick={() => setPhase("quiz")}
            className="px-6 py-3 bg-v2-cyan/15 border border-v2-cyan/40 rounded-xl text-sm mono text-v2-cyan hover:bg-v2-cyan/20 transition-colors"
          >
            All 6 steps explored — Take the Recall Quiz &#8594;
          </button>
        </div>
      )}

      {/* ── Recall Quiz ── */}
      {phase === "quiz" && (
        <div className="border border-v2-border rounded-xl bg-v2-bg-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-v2-border/50">
            <p className="text-sm font-semibold">Recall Quiz</p>
            <p className="text-xs text-v2-text-dim mt-0.5">4 of 5 correct to unlock L1. No tricks — just the mental model.</p>
          </div>

          <div className="divide-y divide-v2-border/30">
            {L0_RECALL_QUIZ.map((q, qi) => (
              <QuizQuestion key={q.id} question={q} index={qi} selected={quizAnswers[q.id] || null} submitted={quizSubmitted} onSelect={selectAnswer} />
            ))}
          </div>

          <div className="px-5 py-4 border-t border-v2-border/50">
            {!quizSubmitted ? (
              <button
                onClick={submitQuiz}
                disabled={Object.keys(quizAnswers).length < L0_RECALL_QUIZ.length}
                className="w-full py-2.5 bg-v2-cyan/15 border border-v2-cyan/40 rounded-lg text-sm mono text-v2-cyan hover:bg-v2-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit ({Object.keys(quizAnswers).length}/{L0_RECALL_QUIZ.length} answered)
              </button>
            ) : quizPassed ? (
              <div className="space-y-3">
                <div className="bg-v2-success/10 border border-v2-success/30 rounded-lg p-4 text-center">
                  <p className="text-sm font-bold text-v2-success">{correctCount}/5 Correct — L0 Complete</p>
                  <p className="text-xs text-v2-text-dim mt-1">You have the mental model. Time for the real thing.</p>
                </div>
                <button
                  onClick={() => { setPhase("complete"); onAdvance(); }}
                  className="w-full py-3 bg-v2-cyan text-v2-bg-deep rounded-xl font-semibold hover:bg-v2-cyan-bright transition-colors"
                >
                  Enter L1 — Boot Sequence &#8594;
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-v2-danger/10 border border-v2-danger/30 rounded-lg p-4 text-center">
                  <p className="text-sm font-bold text-v2-danger">{correctCount}/5 Correct — Need 4 to pass</p>
                  <p className="text-xs text-v2-text-dim mt-1">Review the layers above, then try again.</p>
                </div>
                <button
                  onClick={resetQuiz}
                  className="w-full py-2.5 bg-v2-bg-elevated border border-v2-border rounded-lg text-sm hover:border-v2-cyan/30 transition-colors"
                >
                  Re-read &amp; Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════
// Layer Card — expandable container
// ═══════════════════════════════════════

function LayerCard({
  layer, expanded, revealedSteps, onToggle, onReveal, showConnector,
}: {
  layer: BootLayer; expanded: boolean; revealedSteps: Set<number>;
  onToggle: () => void; onReveal: (n: number) => void; showConnector: boolean;
}) {
  const bothRevealed = layer.steps.every((s) => revealedSteps.has(s.number));

  return (
    <>
      <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        bothRevealed ? "border-v2-success/30 bg-v2-success/5" : "border-v2-border bg-v2-bg-surface"
      }`}>
        {/* Layer top accent bar */}
        <div className="h-1" style={{ backgroundColor: layer.accentHex, opacity: 0.6 }} />

        {/* Layer header */}
        <button onClick={onToggle} className="w-full px-5 py-4 flex items-center gap-4 text-left">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="mono text-[10px] font-bold px-2 py-0.5 rounded" style={{
                color: layer.accentHex, background: `${layer.accentHex}15`, border: `1px solid ${layer.accentHex}30`,
              }}>
                {layer.name.toUpperCase()}
              </span>
              <span className="text-sm font-semibold text-v2-text">{layer.subtitle}</span>
            </div>
            <p className="text-xs text-v2-text-dim mt-1">{layer.failureHint}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {bothRevealed && <span className="text-v2-success text-sm">&#10003;</span>}
            <span className={`text-xs text-v2-text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>&#9662;</span>
          </div>
        </button>

        {/* Expanded: show the 2 steps */}
        {expanded && (
          <div className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {layer.steps.map((step) => (
                <StepCard key={step.number} step={step} revealed={revealedSteps.has(step.number)} accentHex={layer.accentHex} onReveal={() => onReveal(step.number)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Connector between layers */}
      {showConnector && (
        <div className="flex justify-center">
          <div className="w-px h-3 bg-v2-border" />
        </div>
      )}
    </>
  );
}


// ═══════════════════════════════════════
// Step Card — question → answer reveal
// ═══════════════════════════════════════

function StepCard({ step, revealed, accentHex, onReveal }: {
  step: BootLayerStep; revealed: boolean; accentHex: string; onReveal: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className={`rounded-lg border transition-all ${
      revealed ? "border-v2-success/20 bg-v2-bg-deep" : "border-v2-border bg-v2-bg-deep"
    }`}>
      <div className="px-4 py-3">
        {/* Step name + number */}
        <div className="flex items-center gap-2 mb-2">
          <span className="mono text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center"
            style={{ color: accentHex, background: `${accentHex}15` }}>
            {step.number}
          </span>
          <span className="text-xs font-semibold text-v2-text">{step.name}</span>
          {revealed && <span className="text-v2-success text-[10px] ml-auto">&#10003;</span>}
        </div>

        {/* Question */}
        <p className="text-xs text-v2-text-dim mb-2">
          <span className="mono text-v2-text-muted">Q:</span> {step.question}
        </p>

        {/* Answer — hidden until revealed */}
        {!revealed ? (
          <button onClick={onReveal}
            className="w-full py-2 bg-v2-bg-elevated border border-v2-border rounded-lg text-[11px] mono text-v2-text-muted hover:border-v2-cyan/30 hover:text-v2-text transition-colors">
            Reveal Answer
          </button>
        ) : (
          <>
            <div className="bg-v2-bg-surface border border-v2-success/15 rounded-lg px-3 py-2 mb-2">
              <p className="text-xs text-v2-text">
                <span className="mono text-v2-success/70">&rarr;</span> {step.answer}
              </p>
            </div>
            <button onClick={() => setShowDetail(!showDetail)}
              className="text-[10px] mono text-v2-text-muted hover:text-v2-cyan transition-colors">
              {showDetail ? "Hide explanation \u25B4" : "Why? \u25BE"}
            </button>
            {showDetail && (
              <p className="text-[11px] text-v2-text-dim leading-relaxed mt-2">{step.detail}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════
// Quiz Question
// ═══════════════════════════════════════

function QuizQuestion({ question, index, selected, submitted, onSelect }: {
  question: L0RecallQuestion; index: number; selected: string | null;
  submitted: boolean; onSelect: (qId: string, answer: string) => void;
}) {
  const allChoices = [question.correctAnswer, ...question.distractors].sort();

  return (
    <div className="px-5 py-4">
      <p className="text-sm font-medium mb-3">
        <span className="mono text-v2-text-muted text-xs mr-2">{index + 1}.</span>
        {question.question}
      </p>
      <div className="grid grid-cols-1 gap-2">
        {allChoices.map((choice) => {
          const isSelected = selected === choice;
          const isCorrect = choice === question.correctAnswer;
          let btnClass = "px-3 py-2.5 border rounded-lg text-xs text-left transition-colors ";
          if (submitted && isSelected && isCorrect) {
            btnClass += "border-v2-success/50 bg-v2-success/10 text-v2-success";
          } else if (submitted && isSelected && !isCorrect) {
            btnClass += "border-v2-danger/50 bg-v2-danger/10 text-v2-danger";
          } else if (submitted && isCorrect) {
            btnClass += "border-v2-success/30 bg-v2-success/5 text-v2-success/70";
          } else if (isSelected) {
            btnClass += "border-v2-cyan/50 bg-v2-cyan/10 text-v2-cyan";
          } else {
            btnClass += "border-v2-border bg-v2-bg-deep hover:border-v2-cyan/30 text-v2-text-dim";
          }
          return (
            <button key={choice} onClick={() => onSelect(question.id, choice)} disabled={submitted} className={btnClass}>
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
