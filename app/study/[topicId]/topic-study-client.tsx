"use client";

import { useState, useMemo } from "react";
import CardQueue from "@/components/card-queue";
import { TOPICS, ForgeCard, TopicId, mapConvexCard } from "@/lib/types";
import { useCardsByTopic, useDueCards, useNewCards, useAllProgress } from "@/lib/convex-hooks";
import { sortByPriority } from "@/lib/sm2";
import { useRouter } from "next/navigation";

export default function TopicStudyClient({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [sessionCards, setSessionCards] = useState<ForgeCard[]>([]);

  const topic = TOPICS.find((t) => t.id === topicId);
  const rawCards = useCardsByTopic(topicId as TopicId);
  const rawDue = useDueCards(topicId as TopicId);
  const rawNew = useNewCards(topicId as TopicId);
  const progress = useAllProgress();
  const tp = progress.find((p) => p.topicId === topicId);

  const mapCard = mapConvexCard;

  const cards = useMemo(() => rawCards.map(mapCard), [rawCards]);
  const dueCards = useMemo(() => rawDue.map(mapCard), [rawDue]);
  const newCards = useMemo(() => {
    const maxTier = tp?.currentTier ?? 1;
    return rawNew.filter((c) => c.tier <= maxTier).map(mapCard);
  }, [rawNew, tp]);

  const maxTier = tp?.currentTier ?? 1;

  const startDue = () => {
    const due = sortByPriority(dueCards);
    setSessionCards(due.length > 0 ? due : newCards.slice(0, 20));
    setActive(true);
  };
  const startNew = () => { setSessionCards(newCards.slice(0, 20)); setActive(true); };
  const startAll = () => {
    const all = cards.filter((c) => c.tier <= maxTier);
    setSessionCards(sortByPriority(all).slice(0, 40));
    setActive(true);
  };

  if (!topic) {
    return (<div className="max-w-3xl mx-auto px-4 py-8"><p className="text-forge-text-dim">Topic not found.</p></div>);
  }

  if (active && sessionCards.length > 0) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <button onClick={() => { setActive(false); setSessionCards([]); }}
            className="text-sm text-forge-text-dim hover:text-forge-text mb-6 flex items-center gap-1">← End session</button>
          <CardQueue cards={sessionCards} sessionType="topic-drill"
            onComplete={() => { setActive(false); setSessionCards([]); }} />
        </div>
    );
  }

  return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => router.push("/study")}
          className="text-sm text-forge-text-dim hover:text-forge-text mb-6 flex items-center gap-1">← Back to study</button>
        <div className="flex items-center gap-3 mb-6">
          <span className="mono text-forge-accent-text text-2xl">{topic.icon}</span>
          <div>
            <h1 className="text-2xl font-bold">{topic.name}</h1>
            <p className="text-forge-text-dim text-sm">{topic.description}</p>
          </div>
        </div>

        {tp && (
          <div className="bg-forge-surface border border-forge-border rounded-xl p-6 mb-6">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <span className="text-2xl font-bold mono text-forge-accent-text">{tp.masteryPercent}%</span>
                <span className="block text-xs text-forge-text-dim">mastery</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold mono">T{tp.currentTier}</span>
                <span className="block text-xs text-forge-text-dim">tier</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold mono text-forge-success">{tp.masteredCards}</span>
                <span className="block text-xs text-forge-text-dim">mastered</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold mono text-forge-text-muted">{tp.newCards}</span>
                <span className="block text-xs text-forge-text-dim">new</span>
              </div>
            </div>

            {[1, 2, 3, 4].map((tier) => {
              const key = `tier${tier}` as keyof typeof tp.tierProgress;
              const data = tp.tierProgress[key];
              const pct = data && data.total > 0 ? Math.round((data.qualified / data.total) * 100) : 0;
              const unlocked = tier <= tp.currentTier;
              return (
                <div key={tier} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={unlocked ? "text-forge-text" : "text-forge-text-muted"}>
                      Tier {tier} {unlocked ? "" : "(locked)"}
                    </span>
                    <span className="mono text-forge-text-dim">{data?.qualified ?? 0}/{data?.total ?? 0}</span>
                  </div>
                  <div className="h-1 bg-forge-surface-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${unlocked ? "bg-forge-accent" : "bg-forge-text-muted/30"}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          <button onClick={startDue}
            className="w-full bg-forge-accent/10 border border-forge-accent/30 rounded-xl p-4 text-left hover:bg-forge-accent/15 transition-colors">
            <span className="font-semibold text-forge-accent-text">Review Due</span>
            <span className="text-sm text-forge-text-dim ml-2">({dueCards.length} cards)</span>
          </button>
          <button onClick={startNew}
            className="w-full bg-forge-surface border border-forge-border rounded-xl p-4 text-left hover:border-forge-border-hover transition-colors">
            <span className="font-semibold">Learn New Cards</span>
            <span className="text-sm text-forge-text-dim ml-2">({newCards.length} available up to T{maxTier})</span>
          </button>
          <button onClick={startAll}
            className="w-full bg-forge-surface border border-forge-border rounded-xl p-4 text-left hover:border-forge-border-hover transition-colors">
            <span className="font-semibold">Full Topic Drill</span>
            <span className="text-sm text-forge-text-dim ml-2">(up to 40 cards, all unlocked tiers)</span>
          </button>
        </div>
      </div>
  );
}
