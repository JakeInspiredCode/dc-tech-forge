"use client";

import { useState, useCallback } from "react";
import TerminalSim from "@/components/terminal-sim";
import ActionButton from "@/components/ui/action-button";

interface GuidedTask {
  command: string;
  hint: string;
  purpose: string;
}

interface GuidedTerminalProps {
  tasks: GuidedTask[];
  title?: string;
  intro?: string;
  onComplete: () => void;
}

// ── Task sets keyed by mission step contentRef.id ──

const TASK_SETS: Record<string, { title: string; intro: string; tasks: GuidedTask[] }> = {
  intro: {
    title: "Terminal Basics",
    intro: "Try each command in the terminal on the left. They'll check off as you go.",
    tasks: [
      { command: "help", hint: "See what's available", purpose: "Lists all commands this simulator supports. In a real terminal, try `man <command>` for any command's manual." },
      { command: "pwd", hint: "Where am I?", purpose: "Print Working Directory — shows the full path of your current location in the filesystem." },
      { command: "ls", hint: "What's here?", purpose: "Lists files and directories. The most-used command in Linux." },
      { command: "whoami", hint: "Who am I logged in as?", purpose: "Shows your username. Important before running commands that need root or specific permissions." },
      { command: "hostname", hint: "Which machine is this?", purpose: "Shows the server's name. Always verify before running destructive commands — you don't want to reboot the wrong node." },
    ],
  },
  "file-ops": {
    title: "Inspecting Files & Storage",
    intro: "These commands help you find files, check disk space, and understand what's on a server.",
    tasks: [
      { command: "ls -la", hint: "Detailed file listing", purpose: "Shows permissions, owner, size, and hidden files (starting with `.`). `-l` = long format, `-a` = show all including hidden." },
      { command: "cat /etc/hostname", hint: "Read a file's contents", purpose: "`cat` prints a file to the terminal. You'll use this constantly to read config files, logs, and scripts." },
      { command: "lsblk -f", hint: "List storage devices", purpose: "Maps block devices (disks, partitions) to their filesystems and mount points. Essential for knowing which disk is which." },
      { command: "df -hT", hint: "Check disk space", purpose: "Shows how full each filesystem is. `-h` = human-readable sizes, `-T` = show filesystem type. Full disks crash services." },
      { command: "find /var -size +100M", hint: "Hunt large files", purpose: "Searches for files over 100MB in /var. Runaway logs in /var/log are the #1 cause of full disks in data centers." },
      { command: "mount", hint: "Show mounted filesystems", purpose: "Lists every mounted filesystem and its options. Use this to verify expected mounts are present and writable." },
    ],
  },
};

export function getGuidedTaskSet(contentRefId: string) {
  return TASK_SETS[contentRefId] ?? TASK_SETS["intro"];
}

export default function GuidedTerminal({
  tasks,
  title = "Terminal Practice",
  intro = "Try each command in the terminal.",
  onComplete,
}: GuidedTerminalProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const allDone = completed.size >= tasks.length;

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    for (const task of tasks) {
      if (trimmed === task.command.toLowerCase()) {
        setCompleted((prev) => new Set([...prev, task.command]));
      }
    }
  }, [tasks]);

  return (
    <div className="space-y-3">
      {/* Side-by-side: terminal (2/3) + task list (1/3) */}
      <div className="flex gap-3" style={{ minHeight: 340 }}>
        {/* Terminal — left 2/3 */}
        <div className="flex-[2] min-w-0">
          <TerminalSim height={320} onCommand={handleCommand} />
        </div>

        {/* Task list — right 1/3 */}
        <div
          className="flex-1 min-w-0 rounded-lg border border-v2-border bg-v2-bg-surface overflow-y-auto"
          style={{ maxHeight: 360 }}
        >
          <div className="p-3 border-b border-v2-border">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-v2-text uppercase tracking-wider">{title}</h3>
              <span className="text-[10px] mono text-v2-text-dim">{completed.size}/{tasks.length}</span>
            </div>
            <p className="text-[11px] text-v2-text-muted leading-snug">{intro}</p>
          </div>

          <div className="p-2 space-y-1">
            {tasks.map((task) => {
              const isDone = completed.has(task.command);
              const isExpanded = expandedTask === task.command;

              return (
                <div key={task.command}>
                  <button
                    onClick={() => setExpandedTask(isExpanded ? null : task.command)}
                    className={`w-full flex items-start gap-2 p-2 rounded text-left text-xs transition-colors ${
                      isDone ? "bg-v2-cyan/5" : "hover:bg-v2-bg-elevated/80"
                    }`}
                  >
                    <span className={`flex-shrink-0 mt-px ${isDone ? "text-v2-cyan" : "text-v2-text-muted"}`}>
                      {isDone ? "✓" : "○"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className={`text-[11px] ${isDone ? "text-v2-cyan/80 line-through" : "text-v2-cyan"}`}>
                          {task.command}
                        </code>
                        <span className="text-[10px] text-v2-text-muted truncate">{task.hint}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] text-v2-text-muted flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                      ▸
                    </span>
                  </button>

                  {/* Collapsible explanation */}
                  {isExpanded && (
                    <div className="ml-6 mr-2 mb-1 p-2 rounded bg-v2-bg-elevated/50 border-l-2 border-v2-cyan/20">
                      <p className="text-[11px] text-v2-text-dim leading-relaxed">{task.purpose}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Completion */}
      {allDone && (
        <div className="flex justify-center pt-1">
          <ActionButton variant="primary" onClick={onComplete}>
            All commands practiced — Continue mission
          </ActionButton>
        </div>
      )}
    </div>
  );
}
