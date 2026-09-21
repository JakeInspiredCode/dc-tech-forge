"use client";

import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ForgeCard } from "@/lib/types";

interface SpeedRunInputProps {
  card: ForgeCard;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export default function SpeedRunInput({ card, onSubmit, disabled }: SpeedRunInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isCommand = isCommandCard(card.back);

  // Auto-focus and clear on new card
  useEffect(() => {
    setValue("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [card.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) handleSubmit();
    }
  };

  const handleSubmit = () => {
    onSubmit(value);
  };

  return (
    <div className="space-y-4">
      {/* Card question */}
      <div className="bg-v2-bg-surface border border-v2-border rounded-xl p-6 min-h-[140px] flex items-center justify-center">
        <div className="markdown-content text-center text-base leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.front}</ReactMarkdown>
        </div>
      </div>

      {/* Terminal input */}
      <div className="relative">
        <div className="bg-v2-bg-surface border border-v2-border rounded-xl overflow-hidden focus-within:border-v2-cyan/50 transition-colors">
          <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b border-v2-border/50">
            <span className="text-v2-cyan mono text-sm">›</span>
            <span className="text-xs text-v2-text-muted mono">
              {isCommand ? "command" : "answer"} — Enter to submit
            </span>
          </div>
          <textarea aria-label="Your answer"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={isCommand ? 1 : 3}
            placeholder={isCommand ? "type command..." : "type your answer..."}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={`
              w-full bg-transparent px-4 py-3 mono text-sm text-v2-text
              placeholder:text-v2-text-muted resize-none outline-none
              ${disabled ? "opacity-50" : ""}
            `}
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="absolute right-3 bottom-3 px-3 py-1 rounded text-xs mono
            bg-v2-cyan/20 text-v2-cyan border border-v2-cyan/30
            hover:bg-v2-cyan/30 transition-colors disabled:opacity-50"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function isCommandCard(back: string): boolean {
  return back.includes("```") ||
    /^\s*`[a-z]/.test(back) ||
    /\b(sudo|grep|ls |df |ps |kill|find |chmod|systemctl|journalctl|cat |tail|head|awk|sed|curl|ping|ssh|tar)\b/.test(back);
}
