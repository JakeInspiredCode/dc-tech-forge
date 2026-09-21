"use client";

import { useState, useMemo, useRef } from "react";
import { TOPICS, mapConvexCard, ForgeCard } from "@/lib/types";
import { useCards, useSeedCards } from "@/lib/convex-hooks";
import CardEditor from "@/components/card-editor";
import { exportCardsToJSON, downloadJSON, parseImportedCards } from "@/lib/import-export";
import { BRAND } from "@/lib/brand";
import ToolPage from "@/components/ui/tool-page";

type SortKey = "topic" | "type" | "difficulty" | "due" | "mastery";
type StatusFilter = "all" | "new" | "learning" | "mastered" | "overdue";

export default function CardsPage() {
  const rawCards = useCards();
  const cards = useMemo(
    () =>
      rawCards.map((c, i) => ({
        ...mapConvexCard(c),
        _key: c._id ?? `${c.cardId}-${i}`,
      })),
    [rawCards],
  );

  const [showEditor, setShowEditor] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const seedCards = useSeedCards();
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("topic");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Stable "now" that only updates once per mount, not every render
  const [now] = useState(() => new Date().toISOString());

  const getStatus = (card: ForgeCard): StatusFilter => {
    if (card.repetitions === 0) return "new";
    if (card.dueDate <= now) return "overdue";
    if (card.interval >= 21 && card.easeFactor >= 2.5) return "mastered";
    return "learning";
  };

  const filtered = useMemo(() => {
    let result = [...cards];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.front.toLowerCase().includes(q) ||
          c.back.toLowerCase().includes(q)
      );
    }
    if (topicFilter !== "all") result = result.filter((c) => c.topicId === topicFilter);
    if (typeFilter !== "all") result = result.filter((c) => c.type === typeFilter);
    if (difficultyFilter !== "all") result = result.filter((c) => c.difficulty === Number(difficultyFilter));
    if (tierFilter !== "all") result = result.filter((c) => c.tier === Number(tierFilter));
    if (statusFilter !== "all") result = result.filter((c) => getStatus(c) === statusFilter);

    result.sort((a, b) => {
      switch (sortBy) {
        case "topic": return a.topicId.localeCompare(b.topicId);
        case "type": return a.type.localeCompare(b.type);
        case "difficulty": return a.difficulty - b.difficulty;
        case "due": return a.dueDate.localeCompare(b.dueDate);
        case "mastery": return b.easeFactor - a.easeFactor;
        default: return 0;
      }
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, search, topicFilter, typeFilter, difficultyFilter, tierFilter, statusFilter, sortBy]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusColor: Record<string, string> = {
    new: "text-v2-text-muted",
    learning: "text-v2-warning",
    mastered: "text-v2-success",
    overdue: "text-red-400",
  };

  const statusLabel: Record<string, string> = {
    new: "New",
    learning: "Learning",
    mastered: "Mastered",
    overdue: "Overdue",
  };

  return (
    <ToolPage
      title="Card Browser"
      subtitle={`${filtered.length} of ${cards.length} cards`}
      width="wide"
      actions={
        <>
            <button onClick={() => {
              const exportData = rawCards.map((c) => ({
                cardId: c.cardId, topicId: c.topicId, type: c.type,
                front: c.front, back: c.back, difficulty: c.difficulty,
                tier: c.tier, steps: c.steps as string[] | undefined,
              }));
              downloadJSON(exportCardsToJSON(exportData), `${BRAND.slug}-cards-${new Date().toISOString().split("T")[0]}.json`);
            }}
              className="px-3 py-1.5 text-xs mono border border-v2-border rounded-lg hover:bg-v2-bg-elevated transition-colors">
              Export
            </button>
            <input aria-label="Import a card deck (JSON file)" ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const { cards: imported, skipped, error } = parseImportedCards(text);
              if (error) { setImportMsg(error); return; }
              const batch = imported.map((c) => ({
                cardId: c.cardId, topicId: c.topicId, type: c.type,
                front: c.front, back: c.back, difficulty: c.difficulty,
                tier: c.tier, steps: c.steps,
                easeFactor: 2.5, interval: 0, repetitions: 0,
                dueDate: new Date().toISOString().split("T")[0],
              }));
              await seedCards({ cards: batch });
              setImportMsg(
                `Imported ${imported.length} cards (duplicates skipped).` +
                  (skipped > 0 ? ` Ignored ${skipped} that were malformed.` : ""),
              );
              if (fileInputRef.current) fileInputRef.current.value = "";
            }} />
            <button onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs mono border border-v2-border rounded-lg hover:bg-v2-bg-elevated transition-colors">
              Import
            </button>
            <button onClick={() => setShowEditor(true)}
              className="px-3 py-1.5 text-xs mono bg-v2-cyan text-v2-bg-deep rounded-lg hover:bg-v2-cyan-bright transition-colors">
              + New Card
            </button>
        </>
      }
    >

        {importMsg && (
          <div className="mb-4 p-3 bg-v2-bg-surface border border-v2-border rounded-lg text-sm flex items-center justify-between">
            <span>{importMsg}</span>
            <button onClick={() => setImportMsg(null)} className="text-v2-text-muted hover:text-v2-text">&times;</button>
          </div>
        )}

        {showEditor && <CardEditor onClose={() => setShowEditor(false)} onCreated={() => {}} />}

        {/* Search */}
        <input aria-label="Search cards"
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-v2-bg-surface border border-v2-border rounded-lg px-3 py-2 text-sm text-v2-text outline-none focus:border-v2-cyan/50 mb-4"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <select aria-label="Filter by topic" value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}
            className="bg-v2-bg-surface border border-v2-border rounded-lg px-2 py-1.5 text-xs text-v2-text mono outline-none focus:border-v2-cyan/50">
            <option value="all">All Topics</option>
            {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <select aria-label="Filter by card type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-v2-bg-surface border border-v2-border rounded-lg px-2 py-1.5 text-xs text-v2-text mono outline-none focus:border-v2-cyan/50">
            <option value="all">All Types</option>
            <option value="easy">Easy</option>
            <option value="intermediate">Intermediate</option>
            <option value="scenario">Scenario</option>
          </select>

          <select aria-label="Filter by difficulty" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-v2-bg-surface border border-v2-border rounded-lg px-2 py-1.5 text-xs text-v2-text mono outline-none focus:border-v2-cyan/50">
            <option value="all">All Difficulty</option>
            <option value="1">★</option>
            <option value="2">★★</option>
            <option value="3">★★★</option>
          </select>

          <select aria-label="Filter by tier" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}
            className="bg-v2-bg-surface border border-v2-border rounded-lg px-2 py-1.5 text-xs text-v2-text mono outline-none focus:border-v2-cyan/50">
            <option value="all">All Tiers</option>
            <option value="1">Tier 1</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
            <option value="4">Tier 4</option>
          </select>

          <select aria-label="Filter by review status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-v2-bg-surface border border-v2-border rounded-lg px-2 py-1.5 text-xs text-v2-text mono outline-none focus:border-v2-cyan/50">
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="learning">Learning</option>
            <option value="mastered">Mastered</option>
            <option value="overdue">Overdue</option>
          </select>

          <select aria-label="Sort cards by" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-v2-bg-surface border border-v2-border rounded-lg px-2 py-1.5 text-xs text-v2-text mono outline-none focus:border-v2-cyan/50">
            <option value="topic">Sort: Topic</option>
            <option value="type">Sort: Type</option>
            <option value="difficulty">Sort: Difficulty</option>
            <option value="due">Sort: Due Date</option>
            <option value="mastery">Sort: Mastery</option>
          </select>
        </div>

        {/* Card list */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center text-v2-text-dim py-12 text-sm">
              No cards match your filters.
            </div>
          )}
          {filtered.map((card) => {
            const isOpen = expanded.has(card.id);
            const status = getStatus(card);
            const topic = TOPICS.find((t) => t.id === card.topicId);
            return (
              <div key={card._key} className="bg-v2-bg-surface border border-v2-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpand(card.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-v2-bg-elevated transition-colors"
                >
                  <span className="mono text-v2-cyan text-sm shrink-0">{topic?.icon ?? "?"}</span>
                  <span className="text-sm flex-1 truncate">{card.front}</span>
                  <span className={`text-[10px] mono shrink-0 ${statusColor[status]}`}>
                    {statusLabel[status]}
                  </span>
                  <span className="text-[10px] mono text-v2-text-muted shrink-0 capitalize">{card.type}</span>
                  <span className="text-v2-text-muted text-xs shrink-0">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-v2-border px-4 py-4 space-y-3 bg-v2-bg-deep/50">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-v2-text-muted block mb-1">Front</span>
                      <p className="text-sm text-v2-text">{card.front}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-v2-text-muted block mb-1">Back</span>
                      <p className="text-sm text-v2-text whitespace-pre-wrap">{card.back}</p>
                    </div>
                    {card.steps && card.steps.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-v2-text-muted block mb-1">Steps</span>
                        <ol className="list-decimal list-inside text-sm text-v2-text space-y-0.5">
                          {card.steps.map((s, i) => <li key={i}>{s}</li>)}
                        </ol>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-[10px] mono text-v2-text-muted pt-1 border-t border-v2-border/50">
                      <span>Topic: {topic?.name ?? card.topicId}</span>
                      <span>Tier {card.tier}</span>
                      <span>Difficulty {"★".repeat(card.difficulty)}</span>
                      <span>EF: {card.easeFactor.toFixed(2)}</span>
                      <span>Interval: {card.interval}d</span>
                      <span>Reps: {card.repetitions}</span>
                      <span>Due: {new Date(card.dueDate).toLocaleDateString()}</span>
                      {card.lastReview && <span>Last: {new Date(card.lastReview).toLocaleDateString()}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
    </ToolPage>
  );
}
