"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import QuickDrawGame, { QuickDrawSummary } from "@/components/forge/quick-draw/quick-draw-game";
import QuickDrawResults from "@/components/forge/quick-draw/quick-draw-results";
import { getAllModules, QuickDrawModule } from "@/lib/seeds/quick-draw-modules";

type Screen = "setup" | "playing" | "results";
type Mode = "type" | "choice";

export default function QuickDrawPage() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [selectedModule, setSelectedModule] = useState<QuickDrawModule | null>(null);
  const [mode, setMode] = useState<Mode>("type");
  const [summary, setSummary] = useState<QuickDrawSummary | null>(null);

  const addHistory = useMutation(api.forgeQuickDrawHistory.add);
  const addPoints = useMutation(api.forgeProfile.addPoints);
  const checkBadges = useMutation(api.forgeProfile.checkAndAwardBadges);

  const modules = getAllModules();

  // Arsenal links to one module (`?module=ports`). Read from the URL on mount
  // rather than useSearchParams, which would force a Suspense boundary on a
  // statically exported page. The module is offered, not auto-started: the
  // person still picks Type Answer or Multiple Choice.
  const [linkedModule, setLinkedModule] = useState<QuickDrawModule | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("module");
    setLinkedModule(id ? getAllModules().find((m) => m.id === id) ?? null : null);
  }, []);

  const startGame = (mod: QuickDrawModule) => {
    setSelectedModule(mod);
    setSummary(null);
    setScreen("playing");
  };

  const handleComplete = async (s: QuickDrawSummary) => {
    setSummary(s);
    setScreen("results");

    // Persist results + award XP
    if (selectedModule) {
      const xpEarned = Math.round(10 + s.accuracy * 20);
      try {
        await addHistory({
          moduleId: selectedModule.id,
          score: Math.round(s.accuracy * 100),
          totalItems: s.totalCount,
          correctItems: s.correctCount,
          timeMs: s.totalTime,
          xpEarned,
        });
        await addPoints({ points: xpEarned });
        await checkBadges({});
      } catch {
        // Silently handle — game still works without persistence
      }
    }
  };

  if (screen === "playing" && selectedModule) {
    return (
      <div className="min-h-screen bg-v2-bg-deep">
        <div className="px-4 sm:px-6 py-8">
          <QuickDrawGame
            items={selectedModule.items}
            mode={mode}
            onComplete={handleComplete}
            onQuit={() => setScreen("setup")}
          />
        </div>
      </div>
    );
  }

  if (screen === "results" && summary && selectedModule) {
    return (
      <div className="min-h-screen bg-v2-bg-deep">
        <div className="px-4 sm:px-6 py-8">
          <QuickDrawResults
            summary={summary}
            moduleName={selectedModule.title}
            onPlayAgain={() => startGame(selectedModule)}
            onBack={() => setScreen("setup")}
          />
        </div>
      </div>
    );
  }

  // Setup
  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mono mb-1">
          Quick Draw{linkedModule ? `: ${linkedModule.title}` : ""}
        </h1>
        <p className="text-sm text-forge-text-dim mb-6">
          {linkedModule ? linkedModule.description : "Fast recall drills — pick a module and go"}
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("type")}
            className={`px-4 py-2 rounded-lg text-sm mono border transition-colors ${
              mode === "type"
                ? "bg-forge-accent/20 text-forge-accent-text border-forge-accent/40"
                : "border-forge-border text-forge-text-dim hover:text-forge-text"
            }`}
          >
            Type Answer
          </button>
          <button
            onClick={() => setMode("choice")}
            className={`px-4 py-2 rounded-lg text-sm mono border transition-colors ${
              mode === "choice"
                ? "bg-forge-accent/20 text-forge-accent-text border-forge-accent/40"
                : "border-forge-border text-forge-text-dim hover:text-forge-text"
            }`}
          >
            Multiple Choice
          </button>
        </div>

        {linkedModule && (
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              onClick={() => startGame(linkedModule)}
              className="px-6 py-3 bg-forge-accent text-white rounded-xl font-medium hover:bg-forge-accent/90 transition-colors"
            >
              Start — {linkedModule.items.length} items
            </button>
            <Link href="/arsenal" className="text-sm text-forge-accent-text hover:underline underline-offset-4">
              ← Arsenal
            </Link>
          </div>
        )}

        {/* Module grid */}
        {linkedModule && <h2 className="text-sm font-semibold text-forge-text-dim mb-3">Other modules</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modules.filter((mod) => mod.id !== linkedModule?.id).map((mod) => (
            <button
              key={mod.id}
              onClick={() => startGame(mod)}
              className="rounded-xl p-5 border border-forge-border bg-forge-surface hover:border-forge-accent/30 hover:bg-forge-accent/5 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{mod.icon}</span>
                <span className="font-semibold text-sm text-forge-text">{mod.title}</span>
                <span className="text-[10px] mono text-forge-text-muted bg-forge-surface-2 px-1.5 py-0.5 rounded">
                  {mod.items.length} items
                </span>
              </div>
              <p className="text-xs text-forge-text-dim">{mod.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
