"use client";

import { useState, useMemo } from "react";
import CardQueue from "@/components/card-queue";
import { TOPICS, ForgeCard, TopicId, mapConvexCard } from "@/lib/types";
import { useCardsByTopic, useDueCards, useNewCards, useAllProgress } from "@/lib/convex-hooks";
import { isUnseen } from "@/lib/study/sessions";
import Link from "next/link";
import ModeCard from "@/components/study/mode-card";
import ToolPage from "@/components/ui/tool-page";
import { sortByPriority } from "@/lib/sm2";

export default function TopicStudyClient({ topicId }: { topicId: string }) {
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
  // Same definitions as the study hub (lib/study/sessions.ts): new = never
  // studied; due = studied before and scheduled. The two pages must agree.
  const dueCards = useMemo(() => rawDue.map(mapCard).filter((c) => !isUnseen(c)), [rawDue]);
  const newCards = useMemo(() => {
    const maxTier = tp?.currentTier ?? 1;
    return rawNew.filter((c) => c.tier <= maxTier).map(mapCard).filter(isUnseen);
  }, [rawNew, tp]);

  const maxTier = tp?.currentTier ?? 1;

  const startDue = () => {
    setSessionCards(sortByPriority(dueCards));
    setActive(true);
  };
  const startNew = () => { setSessionCards(newCards.slice(0, 20)); setActive(true); };
  const startAll = () => {
    const all = cards.filter((c) => c.tier <= maxTier);
    setSessionCards(sortByPriority(all).slice(0, 40));
    setActive(true);
  };

  if (!topic) {
    return (
      <ToolPage title="Topic not found">
        <p className="text-v2-text-dim">
          There is no topic called “{topicId}”. <Link href="/study" className="text-v2-cyan underline underline-offset-4">Back to Flashcard Review</Link>
        </p>
      </ToolPage>
    );
  }

  if (active && sessionCards.length > 0) {
    return (
      <ToolPage title={topic.name} width="full">
        <button
          type="button"
          onClick={() => { setActive(false); setSessionCards([]); }}
          className="inline-flex items-center max-md:min-h-[44px] text-sm text-v2-text-dim hover:text-v2-text mb-6"
        >
          ← End session
        </button>
        <CardQueue cards={sessionCards} sessionType="topic-drill"
          onComplete={() => { setActive(false); setSessionCards([]); }} />
      </ToolPage>
    );
  }

  const drillPool = cards.filter((c) => c.tier <= maxTier).length;

  return (
    <ToolPage title={topic.name} subtitle={topic.description}>
      <Link
        href="/study"
        className="inline-flex items-center max-md:min-h-[44px] text-sm text-v2-text-dim hover:text-v2-text mb-5"
      >
        ← All topics
      </Link>

      {tp && (
        <section aria-label="Progress in this topic" className="glass-panel rounded-lg p-5 mb-5">
          <dl className="grid grid-cols-4 gap-3 mb-5 text-center">
            {[
              { value: `${tp.masteryPercent}%`, label: "mastery", color: "var(--color-v2-cyan)" },
              { value: `T${tp.currentTier}`, label: "tier", color: "var(--color-v2-text)" },
              { value: String(tp.masteredCards), label: "mastered", color: "var(--color-v2-success)" },
              { value: String(newCards.length), label: "new", color: "var(--color-v2-text-dim)" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="text-xs text-v2-text-muted uppercase tracking-wider">{stat.label}</dt>
                <dd className="telemetry-font text-2xl font-semibold" style={{ color: stat.color }}>{stat.value}</dd>
              </div>
            ))}
          </dl>

          {[1, 2, 3, 4].map((tier) => {
            const key = `tier${tier}` as keyof typeof tp.tierProgress;
            const data = tp.tierProgress[key];
            const pct = data && data.total > 0 ? Math.round((data.qualified / data.total) * 100) : 0;
            const unlocked = tier <= tp.currentTier;
            return (
              <div key={tier} className="mb-2.5 last:mb-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={unlocked ? "text-v2-text" : "text-v2-text-muted"}>
                    Tier {tier}{unlocked ? "" : " — not unlocked yet"}
                  </span>
                  <span className="telemetry-font text-v2-text-dim">{data?.qualified ?? 0}/{data?.total ?? 0}</span>
                </div>
                <div aria-hidden="true" className="h-1.5 bg-v2-bg-overlay rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${unlocked ? "bg-v2-cyan" : "bg-v2-text-muted/40"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </section>
      )}

      <div className="space-y-3">
        <ModeCard
          glyph="▶"
          title="Review due cards"
          description="Cards from this topic that are scheduled for today."
          count={dueCards.length}
          countLabel="due"
          color="var(--color-v2-cyan)"
          unavailable={dueCards.length === 0 ? "Nothing in this topic is due right now." : undefined}
          onStart={startDue}
        />
        <ModeCard
          glyph="◆"
          title="Learn new cards"
          description={`Up to 20 at a time, from ${maxTier === 1 ? "Tier 1" : `tiers 1–${maxTier}`}.`}
          count={newCards.length}
          countLabel="new"
          color="var(--color-v2-green)"
          unavailable={newCards.length === 0 ? "You have started every card in the tiers you have unlocked here." : undefined}
          onStart={startNew}
        />
        <ModeCard
          glyph="◎"
          title="Full topic drill"
          description="Up to 40 cards from every tier you have unlocked, new and old together, most urgent first."
          count={drillPool}
          countLabel="cards"
          color="var(--color-v2-amber)"
          unavailable={drillPool === 0 ? "This topic has no cards in your unlocked tiers." : undefined}
          onStart={startAll}
        />
      </div>
    </ToolPage>
  );
}
