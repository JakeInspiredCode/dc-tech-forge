"use client";

import { useState } from "react";
import FilesystemGame from "@/components/forge/explorer/filesystem-game";
import CommandDissector from "@/components/forge/explorer/command-dissector";
import FilesystemTypes from "@/components/forge/explorer/filesystem-types";

type Tab = "filesystem" | "commands" | "types";
type FSMode = "learn" | "label" | null;

export default function VisualExplorerPage() {
  const [tab, setTab] = useState<Tab>("filesystem");
  const [fsMode, setFsMode] = useState<FSMode>(null);

  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mono mb-1">Visual Explorer</h1>
        <p className="text-sm text-forge-text-dim mb-6">
          Interactive filesystem tree, command dissector, and filesystem types
        </p>

        {/* Tab toggle */}
        <div className="flex gap-2 mb-6">
          {([
            { id: "filesystem" as Tab, label: "Filesystem" },
            { id: "commands" as Tab, label: "Commands" },
            { id: "types" as Tab, label: "Types" },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setFsMode(null); }}
              className={`px-4 py-2 rounded-lg text-sm mono border transition-colors ${
                tab === t.id
                  ? "bg-forge-accent/20 text-forge-accent-text border-forge-accent/40"
                  : "border-forge-border text-forge-text-dim hover:text-forge-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filesystem tab */}
        {tab === "filesystem" && !fsMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setFsMode("learn")}
              className="rounded-xl p-5 border border-forge-border bg-forge-surface hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">🌳</span>
                <span className="font-semibold text-sm text-emerald-400">Learn</span>
              </div>
              <p className="text-xs text-forge-text-dim">Explore the Linux filesystem hierarchy — click to expand, read descriptions</p>
            </button>
            <button
              onClick={() => setFsMode("label")}
              className="rounded-xl p-5 border border-forge-border bg-forge-surface hover:border-orange-500/30 hover:bg-orange-500/5 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">🏷</span>
                <span className="font-semibold text-sm text-orange-400">Label Quiz</span>
              </div>
              <p className="text-xs text-forge-text-dim">Given a description, type the correct path — test your knowledge</p>
            </button>
          </div>
        )}

        {tab === "filesystem" && fsMode && (
          <FilesystemGame mode={fsMode} onBack={() => setFsMode(null)} />
        )}

        {/* Commands tab */}
        {tab === "commands" && (
          <CommandDissector onBack={() => setTab("filesystem")} />
        )}

        {/* Types tab */}
        {tab === "types" && (
          <FilesystemTypes />
        )}
      </div>
    </div>
  );
}
