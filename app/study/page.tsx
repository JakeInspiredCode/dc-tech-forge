"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import CardQueue from "@/components/card-queue";
import ModeCard from "@/components/study/mode-card";
import ToolPage from "@/components/ui/tool-page";
import { TOPICS, ForgeCard, mapConvexCard } from "@/lib/types";
import { useCards, useDueCards, useNewCards, useAllProgress } from "@/lib/convex-hooks";
import { LEARN_PER_SESSION, drillSession, learnSession, learnableCount, reviewSession } from "@/lib/study/sessions";

type StudyMode = "review" | "learn" | "drill";

export default function StudyPage() {
  const [session, setSession] = useState<{ mode: StudyMode; cards: ForgeCard[] } | null>(null);

  const allCards = useCards();
  const dueCardsRaw = useDueCards();
  const progress = useAllProgress();
  const allNewCards = useNewCards();

  const dueCards = useMemo(() => dueCardsRaw.map(mapConvexCard), [dueCardsRaw]);
  const newCards = useMemo(() => allNewCards.map(mapConvexCard), [allNewCards]);
  const cards = useMemo(() => allCards.map(mapConvexCard), [allCards]);

  // What each session WOULD contain — so the page can show real numbers and
  // never start an empty one (it used to: the click silently did nothing).
  const review = useMemo(() => reviewSession(dueCards), [dueCards]);
  const learn = useMemo(() => learnSession(newCards, progress), [newCards, progress]);
  const learnable = useMemo(() => learnableCount(newCards, progress), [newCards, progress]);
  const drill = useMemo(() => drillSession(cards, progress), [cards, progress]);

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

  if (session) {
    return (
      <ToolPage title="Flashcard Review" width="full">
        <button
          type="button"
          onClick={() => setSession(null)}
          className="inline-flex items-center max-md:min-h-[44px] text-sm text-v2-text-dim hover:text-v2-text mb-6"
        >
          ← End session
        </button>
        <CardQueue
          cards={session.cards}
          sessionType="daily-training"
          // Back to this hub, not the home map: the next thing someone wants
          // after a session is usually another one.
          onComplete={() => setSession(null)}
        />
      </ToolPage>
    );
  }

  return (
    <ToolPage
      title="Flashcard Review"
      subtitle="Spaced repetition. Cards come back just before you would forget them — so a few minutes a day beats an hour a week."
    >
      <div className="space-y-3">
        <ModeCard
          glyph="▶"
          title="Review due cards"
          description="Everything scheduled for today, most overdue first."
          count={review.length}
          countLabel="due"
          color="var(--color-v2-cyan)"
          unavailable={review.length === 0 ? "Nothing is due right now. Learn some new cards, or come back tomorrow." : undefined}
          onStart={() => setSession({ mode: "review", cards: review })}
        />

        <ModeCard
          glyph="◆"
          title="Learn new cards"
          description={`Up to ${LEARN_PER_SESSION} at a time, spread across topics, from the tiers you have unlocked.`}
          count={learnable}
          countLabel="new"
          color="var(--color-v2-green)"
          unavailable={learn.length === 0 ? "You have started every card in your unlocked tiers. Reviewing them is what unlocks the next tier." : undefined}
          onStart={() => setSession({ mode: "learn", cards: learn })}
        />

        <ModeCard
          glyph="◎"
          title="Scenario drill"
          description="Scenario and incident cards — the closest thing here to a real ticket."
          count={scenarioUnlocked ? drill.length : undefined}
          countLabel="ready"
          color="var(--color-v2-amber)"
          unavailable={
            !scenarioUnlocked
              ? "Opens when any topic reaches Tier 3."
              : drill.length === 0
              ? "No scenario cards are ready yet."
              : undefined
          }
          onStart={() => setSession({ mode: "drill", cards: drill })}
        >
          {!scenarioUnlocked && drillUnlockInfo && (
            <span className="block mt-3 max-w-sm">
              <span className="block text-xs text-v2-text-muted telemetry-font mb-1.5">{drillUnlockInfo.label}</span>
              <span aria-hidden="true" className="block h-1.5 rounded-full overflow-hidden bg-v2-bg-overlay">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${drillUnlockInfo.total > 0 ? (drillUnlockInfo.qualified / drillUnlockInfo.total) * 100 : 0}%`,
                    background: "var(--color-v2-amber)",
                  }}
                />
              </span>
            </span>
          )}
        </ModeCard>
      </div>

      <h2 className="stats-section-title mt-10 mb-3" style={{ fontSize: 12 }}>Study one topic</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TOPICS.map((topic) => {
          const tp = progress.find((p) => p.topicId === topic.id);
          return (
            <li key={topic.id}>
              <Link
                href={`/study/${topic.id}`}
                className="glass-panel v2-btn-glow rounded-lg p-3 h-full flex flex-col gap-1 min-h-[88px]"
              >
                <span aria-hidden="true" className="mono text-v2-cyan">{topic.icon}</span>
                {/* The full name — it used to be cut to its first word ("Power", "Scale"). */}
                <span className="text-sm text-v2-text leading-snug">{topic.name}</span>
                <span className="text-xs text-v2-text-muted telemetry-font mt-auto">
                  Tier {tp?.currentTier ?? 1} · {Math.round(tp?.masteryPercent ?? 0)}%
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </ToolPage>
  );
}
