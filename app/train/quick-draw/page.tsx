"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import QuickDrawGame, { QuickDrawSummary } from "@/components/forge/quick-draw/quick-draw-game";
import QuickDrawResults from "@/components/forge/quick-draw/quick-draw-results";
import { getAllModules, QuickDrawModule } from "@/lib/seeds/quick-draw-modules";
import ToolPage from "@/components/ui/tool-page";

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
    <ToolPage
      title={`Quick Draw${linkedModule ? `: ${linkedModule.title}` : ""}`}
      subtitle={linkedModule ? linkedModule.description : "Fast recall drills — pick a module and go."}
      width="wide"
    >

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("type")}
            className={`px-4 py-2 rounded-lg text-sm mono border transition-colors ${
              mode === "type"
                ? "bg-v2-cyan/20 text-v2-cyan border-v2-cyan/40"
                : "border-v2-border text-v2-text-dim hover:text-v2-text"
            }`}
          >
            Type Answer
          </button>
          <button
            onClick={() => setMode("choice")}
            className={`px-4 py-2 rounded-lg text-sm mono border transition-colors ${
              mode === "choice"
                ? "bg-v2-cyan/20 text-v2-cyan border-v2-cyan/40"
                : "border-v2-border text-v2-text-dim hover:text-v2-text"
            }`}
          >
            Multiple Choice
          </button>
        </div>

        {linkedModule && (
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              onClick={() => startGame(linkedModule)}
              className="px-6 py-3 bg-v2-cyan text-v2-bg-deep rounded-xl font-medium hover:bg-v2-cyan-bright transition-colors"
            >
              Start — {linkedModule.items.length} items
            </button>
            <Link href="/arsenal" className="text-sm text-v2-cyan hover:underline underline-offset-4">
              ← Arsenal
            </Link>
          </div>
        )}

        {/* Module grid */}
        {linkedModule && <h2 className="text-sm font-semibold text-v2-text-dim mb-3">Other modules</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modules.filter((mod) => mod.id !== linkedModule?.id).map((mod) => (
            <button
              key={mod.id}
              onClick={() => startGame(mod)}
              className="rounded-xl p-5 border border-v2-border bg-v2-bg-surface hover:border-v2-cyan/30 hover:bg-v2-cyan/5 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{mod.icon}</span>
                <span className="font-semibold text-sm text-v2-text">{mod.title}</span>
                <span className="text-[10px] mono text-v2-text-muted bg-v2-bg-elevated px-1.5 py-0.5 rounded">
                  {mod.items.length} items
                </span>
              </div>
              <p className="text-xs text-v2-text-dim">{mod.description}</p>
            </button>
          ))}
        </div>
    </ToolPage>
  );
}
