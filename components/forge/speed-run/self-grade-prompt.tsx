"use client";

import { EvalScore } from "@/lib/forge/evaluator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SelfGradePromptProps {
  expectedAnswer: string;
  userInput: string;
  onGrade: (score: EvalScore) => void;
}

export default function SelfGradePrompt({ expectedAnswer, userInput, onGrade }: SelfGradePromptProps) {
  return (
    <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-5 space-y-4">
      <div>
        <p className="text-xs text-v2-text-dim mono mb-2">You answered:</p>
        <p className="text-sm mono text-v2-text bg-v2-bg-elevated px-3 py-2 rounded border border-v2-border/50 min-h-[40px]">
          {userInput || <span className="text-v2-text-muted italic">no answer</span>}
        </p>
      </div>

      <div>
        <p className="text-xs text-v2-text-dim mono mb-2">Expected answer:</p>
        <div className="text-sm bg-v2-bg-elevated px-3 py-2 rounded border border-v2-cyan/20 markdown-content max-h-[160px] overflow-y-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{expectedAnswer}</ReactMarkdown>
        </div>
      </div>

      <div>
        <p className="text-xs text-v2-text-dim mono mb-3">How did you do?</p>
        <div className="flex gap-2">
          <button
            onClick={() => onGrade("correct")}
            className="flex-1 py-2 rounded-lg border text-sm font-medium mono transition-colors
              bg-v2-success/15 text-v2-success border-v2-success/30 hover:bg-v2-success/25"
          >
            Nailed It
          </button>
          <button
            onClick={() => onGrade("partial")}
            className="flex-1 py-2 rounded-lg border text-sm font-medium mono transition-colors
              bg-v2-warning/15 text-v2-warning border-v2-warning/30 hover:bg-v2-warning/25"
          >
            Close
          </button>
          <button
            onClick={() => onGrade("wrong")}
            className="flex-1 py-2 rounded-lg border text-sm font-medium mono transition-colors
              bg-v2-danger/15 text-v2-danger border-v2-danger/30 hover:bg-v2-danger/25"
          >
            Missed It
          </button>
        </div>
      </div>
    </div>
  );
}
