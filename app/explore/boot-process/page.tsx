"use client";

import { useState } from "react";
import BootLearn from "@/components/forge/boot-process/boot-learn";
import BootTriage from "@/components/forge/boot-process/boot-triage";

type Mode = "hub" | "learn" | "triage";

export default function BootProcessPage() {
  const [mode, setMode] = useState<Mode>("hub");

  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {mode === "hub" && (
          <BootHub onLearn={() => setMode("learn")} onTriage={() => setMode("triage")} />
        )}
        {mode === "learn" && (
          <BootLearn onBack={() => setMode("hub")} />
        )}
        {mode === "triage" && (
          <BootTriage onBack={() => setMode("hub")} />
        )}
      </div>
    </div>
  );
}

function BootHub({ onLearn, onTriage }: { onLearn: () => void; onTriage: () => void }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mono mb-1">Linux Boot Process</h1>
      <p className="text-sm text-forge-text-dim mb-6">
        Learn the boot sequence from zero, then prove you can troubleshoot when it breaks.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Learn path */}
        <button
          onClick={onLearn}
          className="text-left rounded-xl p-6 border border-forge-border bg-forge-surface hover:border-forge-accent/30 hover:bg-forge-accent/5 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl text-forge-accent-text">&#9655;</span>
            <span className="font-bold text-forge-accent-text">Learn</span>
          </div>
          <p className="text-sm text-forge-text mb-3">
            Start with the 3-layer mental model, then walk through each boot stage with forced-recall checks, then go deep on tools, failure modes, and recovery.
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="mono text-[9px] font-bold px-2 py-0.5 rounded text-orange-400 bg-orange-500/10 border border-orange-500/30">L0 MENTAL MODEL</span>
            <span className="mono text-[9px] font-bold px-2 py-0.5 rounded text-sky-400 bg-sky-500/10 border border-sky-500/30">L1 PIPELINE</span>
            <span className="mono text-[9px] font-bold px-2 py-0.5 rounded text-purple-400 bg-purple-500/10 border border-purple-500/30">L2 DEEP DIVE</span>
          </div>
        </button>

        {/* Triage game */}
        <button
          onClick={onTriage}
          className="text-left rounded-xl p-6 border border-forge-border bg-forge-surface hover:border-forge-danger/30 hover:bg-forge-danger/5 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl text-forge-danger">&#9888;</span>
            <span className="font-bold text-forge-danger">Boot Triage</span>
          </div>
          <p className="text-sm text-forge-text mb-3">
            Real incident scenarios — diagnose boot failures, pick the right tools, trace root cause, and recover the server.
          </p>
          <div className="flex gap-2">
            <span className="mono text-[9px] font-bold px-2 py-0.5 rounded text-forge-warning bg-forge-warning/10 border border-forge-warning/30">5 SCENARIOS</span>
            <span className="mono text-[9px] font-bold px-2 py-0.5 rounded text-forge-danger bg-forge-danger/10 border border-forge-danger/30">TROUBLESHOOTING</span>
          </div>
        </button>
      </div>

      {/* Decision pattern reference */}
      <div className="mt-8 bg-forge-surface border border-forge-border rounded-xl p-5">
        <p className="text-[10px] uppercase text-forge-text-muted font-bold tracking-wider mb-3">THE DECISION PATTERN</p>
        <p className="text-xs text-forge-text-dim mb-3 italic">
          "Work from the bottom up: power &rarr; firmware &rarr; bootloader &rarr; kernel &rarr; initramfs &rarr; systemd &rarr; services. At each layer, ask two questions:"
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-forge-bg rounded-lg p-3 border border-forge-border">
            <p className="mono text-xs text-forge-accent-text font-bold mb-1">1. How far did it get?</p>
            <p className="text-[11px] text-forge-text-dim">Identify the phase — each phase has distinct symptoms.</p>
          </div>
          <div className="bg-forge-bg rounded-lg p-3 border border-forge-border">
            <p className="mono text-xs text-forge-accent-text font-bold mb-1">2. What can I still reach?</p>
            <p className="text-[11px] text-forge-text-dim">Determines which tools are available for diagnosis.</p>
          </div>
        </div>
        <p className="text-[11px] text-forge-text-muted mt-3">
          Capture evidence before rebooting. SEL logs, console output, panic traces — document first, then recover.
        </p>
      </div>
    </div>
  );
}
