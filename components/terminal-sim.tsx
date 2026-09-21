"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TERMINAL_COMMANDS, HOSTNAME, PROMPT_USER } from "@/lib/terminal-data";

interface HistoryEntry {
  type: "input" | "output" | "error" | "system";
  text: string;
}

export interface TerminalSimProps {
  height?: number;
  onCommand?: (cmd: string, resolvedCmd?: string) => void;
  /** When true the terminal fills its parent height instead of using a fixed pixel value */
  fillHeight?: boolean;
}

export default function TerminalSim({ height = 240, onCommand, fillHeight }: TerminalSimProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: "system", text: `Welcome to ${HOSTNAME}. Type 'help' for available commands.` },
  ]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const exec = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setCmdHistory((h) => [trimmed, ...h]);
    setHistIdx(-1);

    if (trimmed === "clear") {
      setHistory([{ type: "system", text: "Terminal cleared." }]);
      setInput("");
      return;
    }

    const newHistory: HistoryEntry[] = [
      ...history,
      { type: "input", text: trimmed },
    ];

    const match = TERMINAL_COMMANDS[trimmed];
    if (match) {
      newHistory.push({ type: "output", text: match.output });
      onCommand?.(trimmed);
    } else {
      // Check for close match (same base command, different flags)
      const baseCmd = trimmed.split(" ")[0];
      const closeMatch = Object.keys(TERMINAL_COMMANDS).find(
        (k) => k.split(" ")[0] === baseCmd && k !== trimmed,
      );
      if (closeMatch) {
        const closeCmdData = TERMINAL_COMMANDS[closeMatch];
        newHistory.push({
          type: "system",
          text: `≈ Close match — showing output for: ${closeMatch}`,
        });
        newHistory.push({ type: "output", text: closeCmdData.output });
        newHistory.push({
          type: "system",
          text: `(In a live environment, different flags would change the output)`,
        });
        // Fire onCommand with both typed and resolved command
        onCommand?.(trimmed, closeMatch);
        setHistory(newHistory);
        setInput("");
        return;
      } else {
        newHistory.push({
          type: "error",
          text: `bash: ${baseCmd}: command not found (try 'help')`,
        });
      }
      onCommand?.(trimmed);
    }

    setHistory(newHistory);
    setInput("");
  }, [history]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      exec(input);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = Math.min(histIdx + 1, cmdHistory.length - 1);
        setHistIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx > 0) {
        setHistIdx(histIdx - 1);
        setInput(cmdHistory[histIdx - 1]);
      } else {
        setHistIdx(-1);
        setInput("");
      }
    }
  };

  return (
    <div
      className={`rounded-lg border border-forge-border overflow-hidden flex flex-col ${fillHeight ? "h-full" : ""}`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="bg-forge-surface-2 px-3 py-1.5 flex items-center gap-1.5 border-b border-forge-border shrink-0">
        <span className="w-2 h-2 rounded-full bg-forge-danger" />
        <span className="w-2 h-2 rounded-full bg-forge-warning" />
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <span className="ml-1.5 mono text-[10px] text-forge-text-muted truncate">
          ops@{HOSTNAME}:~
        </span>
      </div>

      {/* Scrollable area: output + input together so prompt sits right under output */}
      <div
        className="bg-forge-bg p-2 overflow-y-auto mono text-[11px] leading-snug flex-1 min-h-0"
        style={fillHeight ? undefined : { height }}
      >
        {history.map((h, i) => (
          <div key={i} className="mb-0.5 whitespace-pre-wrap break-all">
            {h.type === "input" && (
              <span>
                <span className="text-green-400">{PROMPT_USER}</span>
                <span className="text-forge-text-muted">:</span>
                <span className="text-cyan-400">~</span>
                <span className="text-forge-text-muted">$ </span>
                <span className="text-forge-text">{h.text}</span>
              </span>
            )}
            {h.type === "output" && (
              <span className="text-forge-text-dim">{h.text}</span>
            )}
            {h.type === "error" && (
              <span className="text-forge-danger">{h.text}</span>
            )}
            {h.type === "system" && (
              <span className="text-forge-warning">{h.text}</span>
            )}
          </div>
        ))}

        {/* Input line — inline with output, pushed down as output grows */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-green-400 shrink-0">$</span>
          <input aria-label="Terminal command"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="type a command..."
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-forge-text placeholder:text-forge-text-muted"
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}
