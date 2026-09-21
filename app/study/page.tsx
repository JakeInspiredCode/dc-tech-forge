"use client";

import { useState, useMemo } from "react";
import CardQueue from "@/components/card-queue";
import { TOPICS, ForgeCard, mapConvexCard } from "@/lib/types";
import { useCards, useDueCards, useNewCards, useAllProgress } from "@/lib/convex-hooks";
import { sortByPriority } from "@/lib/sm2";
import { useRouter } from "next/navigation";

type StudyMode = "review" | "learn" | "drill" | null;

export default function StudyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<StudyMode>(null);
  const [sessionCards, setSessionCards] = useState<ForgeCard[]>([]);

  const allCards = useCards();
  const dueCardsRaw = useDueCards();
  const progress = useAllProgress();
  const allNewCards = useNewCards();

  const mapCard = mapConvexCard;

  const dueCards = useMemo(() => dueCardsRaw.map(mapCard), [dueCardsRaw]);
  const newCards = useMemo(() => allNewCards.map(mapCard), [allNewCards]);
  const cards = useMemo(() => allCards.map(mapCard), [allCards]);

  const startSession = (selectedMode: StudyMode) => {
    let selected: ForgeCard[] = [];

    if (selectedMode === "review") {
      selected = sortByPriority(dueCards);
    } else if (selectedMode === "learn") {
      const allNew: ForgeCard[] = [];
      TOPICS.forEach((topic) => {
        const tp = progress.find((p) => p.topicId === topic.id);
        const maxTier = tp?.currentTier ?? 1;
        const topicNew = newCards
          .filter((c) => c.topicId === topic.id && c.tier <= maxTier);
        allNew.push(...topicNew.slice(0, 10));
      });
      selected = allNew.slice(0, 30);
    } else if (selectedMode === "drill") {
      selected = cards.filter((c) => {
        if (c.tier < 3) return false;
        const tp = progress.find((p) => p.topicId === c.topicId);
        return tp && tp.currentTier >= c.tier;
      });
      selected = sortByPriority(selected).slice(0, 20);
    }
    setSessionCards(selected);
    setMode(selectedMode);
  };

  const dueCount = dueCards.length;
  const newCount = newCards.length;
  const scenarioUnlocked = progress.some((p) => p.currentTier >= 3);

  // Compute closest-to-unlock info for drill lock UI
  const drillUnlockInfo = useMemo(() => {
    if (scenarioUnlocked) return null;
    // Find topic closest to unlocking Tier 3 (needs 70% of Tier 2 qualified)
    let bestTopic = "";
    let bestQualified = 0;
    let bestTotal = 0;
    for (const tp of progress) {
      if (tp.currentTier >= 2) {
        const t2 = tp.tierProgress.tier2;
        if (t2.total > 0 && (t2.qualified / t2.total) > (bestTotal > 0 ? bestQualified / bestTotal : -1)) {
          bestTopic = tp.topicId;
          bestQualified = t2.qualified;
          bestTotal = t2.total;
        }
      }
    }
    // If no topic at Tier 2 yet, show Tier 1 progress for closest topic
    if (!bestTopic) {
      for (const tp of progress) {
        const t1 = tp.tierProgress.tier1;
        if (t1.total > 0 && t1.qualified > bestQualified) {
          bestTopic = tp.topicId;
          bestQualified = t1.qualified;
          bestTotal = t1.total;
        }
      }
      if (bestTopic && bestTotal > 0) {
        const needed = Math.ceil(bestTotal * 0.7) - bestQualified;
        return { topic: bestTopic, qualified: bestQualified, total: bestTotal, needed: Math.max(0, needed),
          label: `${bestQualified}/${bestTotal} Tier 1 qualified in ${bestTopic} — ${Math.max(0, needed)} more to unlock Tier 2 first` };
      }
      return null;
    }
    const needed = Math.ceil(bestTotal * 0.7) - bestQualified;
    return { topic: bestTopic, qualified: bestQualified, total: bestTotal, needed: Math.max(0, needed),
      label: `${bestQualified}/${bestTotal} intermediate cards qualified in ${bestTopic} — ${Math.max(0, needed)} more to unlock scenarios` };
  }, [progress, scenarioUnlocked]);

  // Active session
  if (mode && sessionCards.length > 0) {
    return (
      <div className="min-h-screen bg-v2-bg-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => { setMode(null); setSessionCards([]); }}
            className="text-sm text-forge-text-dim hover:text-forge-text mb-6 flex items-center gap-1"
          >
            ← End session
          </button>
          <CardQueue
            cards={sessionCards}
            sessionType="daily-training"
            // Back to the study hub (this page), not the home map: the next thing
            // someone wants after a session is usually another one.
            onComplete={() => { setMode(null); setSessionCards([]); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Study Mode
        </h1>
        <div className="space-y-4">
          <button onClick={() => startSession("review")}
            className="w-full text-left bg-forge-surface border border-forge-border rounded-xl p-6 hover:border-forge-accent/30 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-forge-accent-text">▶</span> Review Due Cards
                </h2>
                <p className="text-sm text-forge-text-dim mt-1">Cards scheduled for today across all topics and tiers</p>
              </div>
              <span className={`text-xl mono font-bold ${dueCount > 0 ? "text-forge-accent-text" : "text-forge-text-muted"}`}>{dueCount}</span>
            </div>
          </button>

          <button onClick={() => startSession("learn")}
            className="w-full text-left bg-forge-surface border border-forge-border rounded-xl p-6 hover:border-forge-success/30 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-forge-success">◆</span> Learn New Cards
                </h2>
                <p className="text-sm text-forge-text-dim mt-1">Fresh cards from your current unlocked tiers</p>
              </div>
              <span className="text-xl mono font-bold text-forge-success">{newCount}</span>
            </div>
          </button>

          <button onClick={() => scenarioUnlocked ? startSession("drill") : undefined}
            className={`w-full text-left bg-forge-surface border rounded-xl p-6 transition-colors ${
              scenarioUnlocked ? "border-forge-border hover:border-forge-warning/30" : "border-forge-border opacity-80 cursor-not-allowed"
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-forge-warning">◎</span> Scenario Drill
                </h2>
                <p className="text-sm text-forge-text-dim mt-1">
                  {scenarioUnlocked ? "Practice scenario and incident branching cards" : "Locked — reach Tier 3 in any topic to unlock"}
                </p>
                {!scenarioUnlocked && drillUnlockInfo && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="mono text-forge-text-muted">{drillUnlockInfo.label}</span>
                    </div>
                    <div className="h-1.5 bg-forge-surface-2 rounded-full overflow-hidden w-64">
                      <div className="h-full bg-forge-warning/60 rounded-full transition-all duration-500"
                        style={{ width: `${drillUnlockInfo.total > 0 ? (drillUnlockInfo.qualified / drillUnlockInfo.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
              </div>
              {!scenarioUnlocked && (
                <span className="text-xs mono text-forge-text-muted bg-forge-surface-2 px-3 py-1 rounded">LOCKED</span>
              )}
            </div>
          </button>
        </div>

        <h2 className="text-lg font-semibold mt-10 mb-4">Study by Topic</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TOPICS.map((topic) => {
            const tp = progress.find((p) => p.topicId === topic.id);
            return (
              <button key={topic.id} onClick={() => router.push(`/study/${topic.id}`)}
                className="bg-forge-surface border border-forge-border rounded-lg p-3 text-left hover:border-forge-border-hover transition-colors">
                <span className="mono text-forge-accent-text">{topic.icon}</span>
                <span className="block text-sm mt-1">{topic.name.split(" ")[0]}</span>
                <span className="block text-xs text-forge-text-muted mono">T{tp?.currentTier ?? 1}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
