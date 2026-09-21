"use client";

import { useMemo, useState } from "react";
import { useCards, useRecentSessions, useSpeedRunsRecent } from "@/lib/convex-hooks";
import { TOPICS } from "@/lib/types";

// Past study sessions and speed runs, searchable by card question.
// Lived on /progress, which production had been redirecting to /profile —
// so nobody could reach it. It is Profile's History tab now.

const SESSION_LABELS: Record<string, string> = {
  "daily-training": "Daily Training",
  "topic-drill": "Topic Drill",
  "mock-interview": "Mock Interview",
};

const RESULT_COLOR: Record<string, string> = {
  correct: "text-v2-success",
  partial: "text-v2-warning",
  wrong: "text-v2-danger",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SessionHistory() {
  const cards = useCards();
  const recentSessions = useRecentSessions(40);
  const speedRuns = useSpeedRunsRecent(30);
  const [historyTab, setHistoryTab] = useState<"sessions" | "speed-runs">("sessions");
  const [historySearch, setHistorySearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  return (
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
  );
}

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
      <p className="text-sm text-v2-text-dim mb-4">
        Browse past sessions and find specific cards you've reviewed.
      </p>

      <input aria-label="Search session history by card question"
        type="text"
        placeholder='Search by card question — e.g. "what is iSCSI"'
        value={historySearch}
        onChange={(e) => setHistorySearch(e.target.value)}
        className="w-full bg-v2-bg-surface border border-v2-border rounded-lg px-3 py-2 text-sm mono text-v2-text outline-none focus:border-v2-cyan/50 mb-4 placeholder:text-v2-text-muted"
      />

      <div className="flex gap-2 mb-5">
        {(["sessions", "speed-runs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setHistoryTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm mono transition-colors border ${
              historyTab === t
                ? "bg-v2-cyan/20 text-v2-cyan border-v2-cyan/40"
                : "text-v2-text-dim border-v2-border hover:border-v2-cyan/30"
            }`}
          >
            {t === "sessions" ? `Sessions (${filteredSessions.length})` : `Speed Runs (${filteredSpeedRuns.length})`}
          </button>
        ))}
      </div>

      {historyTab === "sessions" && (
        <div className="space-y-2">
          {filteredSessions.length === 0 && (
            <p className="text-v2-text-muted text-sm mono py-12 text-center">
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
              <div key={id} className="bg-v2-bg-surface border border-v2-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggle(id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-v2-bg-elevated transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-v2-bg-elevated border border-v2-border px-2 py-0.5 rounded mono">
                      {SESSION_LABELS[s.type] ?? s.type}
                    </span>
                    <span className="text-sm text-v2-text-dim">{s.cardIds.length} cards</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-v2-text-muted">{formatDate(s.startTime)}</span>
                    <span className="text-v2-text-dim text-xs">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-v2-border divide-y divide-v2-border max-h-80 overflow-y-auto">
                    {displayCards.length === 0 && (
                      <p className="text-xs text-v2-text-muted px-4 py-3">No cards.</p>
                    )}
                    {displayCards.map((cid) => {
                      const card = cardMap.get(cid);
                      const topic = TOPICS.find((t) => t.id === card?.topicId);
                      return (
                        <div key={cid} className="flex items-start justify-between gap-3 px-4 py-2.5">
                          <span className="text-xs text-v2-text leading-relaxed flex-1">{card?.front ?? cid}</span>
                          <span className="text-[10px] text-v2-text-muted mono shrink-0 pt-0.5">
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
            <p className="text-v2-text-muted text-sm mono py-12 text-center">
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
              <div key={id} className="bg-v2-bg-surface border border-v2-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggle(id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-v2-bg-elevated transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-v2-bg-elevated border border-v2-border px-2 py-0.5 rounded mono">
                      {topicName}
                    </span>
                    <span className="text-sm font-bold mono text-v2-cyan">{r.totalPoints} pts</span>
                    <span className="text-xs text-v2-text-dim">{accuracy}% accuracy</span>
                    <span className="text-xs text-v2-text-muted">{r.totalCards} cards</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-v2-text-muted">{formatDate(r.timestamp)}</span>
                    <span className="text-v2-text-dim text-xs">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-v2-border divide-y divide-v2-border max-h-80 overflow-y-auto">
                    {displayResults.map(
                      (cr: { cardId: string; result: string; userInput: string; feedback: string }, j: number) => {
                        const card = cardMap.get(cr.cardId);
                        return (
                          <div key={j} className="px-4 py-2.5">
                            <div className="flex items-start justify-between gap-3 mb-0.5">
                              <span className="text-xs text-v2-text leading-relaxed flex-1">{card?.front ?? cr.cardId}</span>
                              <span className={`text-[10px] mono font-medium shrink-0 pt-0.5 ${RESULT_COLOR[cr.result] ?? "text-v2-text-dim"}`}>
                                {cr.result}
                              </span>
                            </div>
                            {cr.userInput && (
                              <p className="text-[10px] text-v2-text-muted mono truncate">{cr.userInput}</p>
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
