"use client";

import { useState, useMemo } from "react";
import { TOPICS, BADGE_DEFS } from "@/lib/types";
import { useAllProgress, useProfile, useSessions, useReviews, useCards, useRecentSessions, useSpeedRunsRecent } from "@/lib/convex-hooks";

const SESSION_LABELS: Record<string, string> = {
  "daily-training": "Daily Training",
  "topic-drill": "Topic Drill",
  "mock-interview": "Mock Interview",
};

const RESULT_COLOR: Record<string, string> = {
  correct: "text-forge-success",
  partial: "text-forge-warning",
  wrong: "text-forge-danger",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ProgressPage() {
  const progress = useAllProgress();
  const profile = useProfile();
  const sessions = useSessions();
  const reviews = useReviews();
  const cards = useCards();
  const recentSessions = useRecentSessions(40);
  const speedRuns = useSpeedRunsRecent(30);

  const [historyTab, setHistoryTab] = useState<"sessions" | "speed-runs">("sessions");
  const [historySearch, setHistorySearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const totalReviews = reviews.length;
  const totalCards = cards.length;
  const overallMastery = progress.length > 0
    ? Math.round(progress.reduce((s, p) => s + p.masteryPercent, 0) / progress.length)
    : 0;

  return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6 mono">Progress</h1>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Mastery", value: `${overallMastery}%`, color: overallMastery >= 85 ? "text-forge-success" : "text-forge-accent-text" },
            { label: "Reviews", value: totalReviews.toString(), color: "text-forge-text" },
            { label: "Streak", value: profile?.streak.toString() ?? "0", color: "text-forge-warning" },
            { label: "Points", value: profile?.totalPoints.toString() ?? "0", color: "text-forge-accent-text" },
            { label: "Sessions", value: sessions.length.toString(), color: "text-forge-text" },
          ].map((stat) => (
            <div key={stat.label} className="bg-forge-surface border border-forge-border rounded-xl p-4 text-center">
              <span className={`text-xl font-bold mono ${stat.color}`}>{stat.value}</span>
              <span className="block text-xs text-forge-text-dim mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-4">Badges</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
          {BADGE_DEFS.map((badge) => {
            const earned = profile?.badges.includes(badge.id) ?? false;
            return (
              <div key={badge.id} className={`rounded-xl p-4 text-center border transition-colors ${
                earned ? "bg-forge-accent/10 border-forge-accent/30 forge-glow" : "bg-forge-surface border-forge-border opacity-80"}`}>
                <span className="text-2xl block mb-1">
                  {badge.icon === "anvil" ? "⬡" : badge.icon === "flame-silver" ? "△" :
                   badge.icon === "flame-gold" ? "▲" : badge.icon === "terminal" ? ">" :
                   badge.icon === "crosshair" ? "◎" : badge.icon === "signal" ? "~" :
                   badge.icon === "star" ? "★" : badge.icon === "bolt" ? "⚡" :
                   badge.icon === "chain" ? "⊘" : "●"}
                </span>
                <span className="text-xs font-medium block">{badge.name}</span>
                <span className="text-[10px] text-forge-text-muted block mt-0.5">{badge.condition}</span>
              </div>
            );
          })}
        </div>

        <h2 className="text-lg font-semibold mb-4">Topic Breakdown</h2>
        <div className="space-y-3 mb-8">
          {TOPICS.map((topic) => {
            const tp = progress.find((p) => p.topicId === topic.id);
            const mastery = tp?.masteryPercent ?? 0;
            return (
              <div key={topic.id} className="bg-forge-surface border border-forge-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="mono text-forge-accent-text">{topic.icon}</span>
                    <span className="text-sm font-medium">{topic.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs mono">
                    <span className="text-forge-text-muted">T{tp?.currentTier ?? 1}</span>
                    <span className={mastery >= 85 ? "text-forge-success" : mastery >= 50 ? "text-forge-warning" : "text-forge-text-dim"}>{mastery}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-forge-surface-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${mastery >= 85 ? "bg-forge-success" : mastery >= 50 ? "bg-forge-warning" : "bg-forge-accent"}`}
                    style={{ width: `${mastery}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── SESSION HISTORY ─── */}
        <HistorySection
          recentSessions={recentSessions}
          speedRuns={speedRuns}
          cards={cards}
          historyTab={historyTab}
          setHistoryTab={setHistoryTab}
          historySearch={historySearch}
          setHistorySearch={setHistorySearch}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </div>
  );
}

/* ─── History Section (moved from /history) ─── */
function HistorySection({
  recentSessions,
  speedRuns,
  cards,
  historyTab,
  setHistoryTab,
  historySearch,
  setHistorySearch,
  expanded,
  setExpanded,
}: {
  recentSessions: ReturnType<typeof useRecentSessions>;
  speedRuns: ReturnType<typeof useSpeedRunsRecent>;
  cards: ReturnType<typeof useCards>;
  historyTab: "sessions" | "speed-runs";
  setHistoryTab: (t: "sessions" | "speed-runs") => void;
  historySearch: string;
  setHistorySearch: (s: string) => void;
  expanded: Set<string>;
  setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const cardMap = useMemo(() => {
    const map = new Map<string, { front: string; topicId: string }>();
    for (const c of cards) map.set(c.cardId, { front: c.front, topicId: c.topicId });
    return map;
  }, [cards]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const q = historySearch.toLowerCase().trim();

  const filteredSessions = useMemo(() => {
    if (!q) return recentSessions;
    return recentSessions.filter((s) =>
      s.cardIds.some((id) => cardMap.get(id)?.front.toLowerCase().includes(q))
    );
  }, [recentSessions, q, cardMap]);

  const filteredSpeedRuns = useMemo(() => {
    if (!q) return speedRuns;
    return speedRuns.filter((r) =>
      r.cardResults.some((cr: { cardId: string }) =>
        cardMap.get(cr.cardId)?.front.toLowerCase().includes(q)
      )
    );
  }, [speedRuns, q, cardMap]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Session History</h2>
      <p className="text-sm text-forge-text-dim mb-4">
        Browse past sessions and find specific cards you've reviewed.
      </p>

      <input
        type="text"
        placeholder='Search by card question — e.g. "what is iSCSI"'
        value={historySearch}
        onChange={(e) => setHistorySearch(e.target.value)}
        className="w-full bg-forge-surface border border-forge-border rounded-lg px-3 py-2 text-sm mono text-forge-text outline-none focus:border-forge-accent/50 mb-4 placeholder:text-forge-text-muted"
      />

      <div className="flex gap-2 mb-5">
        {(["sessions", "speed-runs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setHistoryTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm mono transition-colors border ${
              historyTab === t
                ? "bg-forge-accent/20 text-forge-accent-text border-forge-accent/40"
                : "text-forge-text-dim border-forge-border hover:border-forge-border-hover"
            }`}
          >
            {t === "sessions" ? `Sessions (${filteredSessions.length})` : `Speed Runs (${filteredSpeedRuns.length})`}
          </button>
        ))}
      </div>

      {historyTab === "sessions" && (
        <div className="space-y-2">
          {filteredSessions.length === 0 && (
            <p className="text-forge-text-muted text-sm mono py-12 text-center">
              {q ? "No sessions match that search." : "No sessions recorded yet."}
            </p>
          )}
          {filteredSessions.map((s, i) => {
            const id = `session-${i}`;
            const isOpen = expanded.has(id);
            const displayCards = q
              ? s.cardIds.filter((cid) => cardMap.get(cid)?.front.toLowerCase().includes(q))
              : s.cardIds;

            return (
              <div key={id} className="bg-forge-surface border border-forge-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggle(id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-forge-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-forge-surface-2 border border-forge-border px-2 py-0.5 rounded mono">
                      {SESSION_LABELS[s.type] ?? s.type}
                    </span>
                    <span className="text-sm text-forge-text-dim">{s.cardIds.length} cards</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-forge-text-muted">{formatDate(s.startTime)}</span>
                    <span className="text-forge-text-dim text-xs">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-forge-border divide-y divide-forge-border max-h-80 overflow-y-auto">
                    {displayCards.length === 0 && (
                      <p className="text-xs text-forge-text-muted px-4 py-3">No cards.</p>
                    )}
                    {displayCards.map((cid) => {
                      const card = cardMap.get(cid);
                      const topic = TOPICS.find((t) => t.id === card?.topicId);
                      return (
                        <div key={cid} className="flex items-start justify-between gap-3 px-4 py-2.5">
                          <span className="text-xs text-forge-text leading-relaxed flex-1">{card?.front ?? cid}</span>
                          <span className="text-[10px] text-forge-text-muted mono shrink-0 pt-0.5">
                            {topic?.name ?? card?.topicId ?? ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {historyTab === "speed-runs" && (
        <div className="space-y-2">
          {filteredSpeedRuns.length === 0 && (
            <p className="text-forge-text-muted text-sm mono py-12 text-center">
              {q ? "No speed runs match that search." : "No speed runs recorded yet."}
            </p>
          )}
          {filteredSpeedRuns.map((r, i) => {
            const id = `run-${i}`;
            const isOpen = expanded.has(id);
            const accuracy = r.totalCards > 0 ? Math.round((r.correctCards / r.totalCards) * 100) : 0;
            const topicName = r.topicId === "mixed" ? "Mixed" : TOPICS.find((t) => t.id === r.topicId)?.name ?? r.topicId;
            const displayResults = q
              ? r.cardResults.filter((cr: { cardId: string }) => cardMap.get(cr.cardId)?.front.toLowerCase().includes(q))
              : r.cardResults;

            return (
              <div key={id} className="bg-forge-surface border border-forge-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggle(id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-forge-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-forge-surface-2 border border-forge-border px-2 py-0.5 rounded mono">
                      {topicName}
                    </span>
                    <span className="text-sm font-bold mono text-forge-accent-text">{r.totalPoints} pts</span>
                    <span className="text-xs text-forge-text-dim">{accuracy}% accuracy</span>
                    <span className="text-xs text-forge-text-muted">{r.totalCards} cards</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-forge-text-muted">{formatDate(r.timestamp)}</span>
                    <span className="text-forge-text-dim text-xs">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-forge-border divide-y divide-forge-border max-h-80 overflow-y-auto">
                    {displayResults.map(
                      (cr: { cardId: string; result: string; userInput: string; feedback: string }, j: number) => {
                        const card = cardMap.get(cr.cardId);
                        return (
                          <div key={j} className="px-4 py-2.5">
                            <div className="flex items-start justify-between gap-3 mb-0.5">
                              <span className="text-xs text-forge-text leading-relaxed flex-1">{card?.front ?? cr.cardId}</span>
                              <span className={`text-[10px] mono font-medium shrink-0 pt-0.5 ${RESULT_COLOR[cr.result] ?? "text-forge-text-dim"}`}>
                                {cr.result}
                              </span>
                            </div>
                            {cr.userInput && (
                              <p className="text-[10px] text-forge-text-muted mono truncate">{cr.userInput}</p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
