"use client";

import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import type { Doc, TicketHistoryFields } from "@/lib/data/schema";
import TicketTerminal, { TicketAttemptResult } from "@/components/ticket-smash/ticket-terminal";
import RadarCanvas, { RadarCategory } from "@/components/ticket-smash/radar-canvas";
import {
  TICKET_SCENARIOS,
  TICKET_LEVELS,
  TICKET_DIFFICULTIES,
  TicketDifficulty,
  TicketScenario,
  getTicketsByDifficulty,
} from "@/lib/ticket-scenarios";

// ── Sector color palette (per difficulty) ──

const SECTOR_COLORS: Record<TicketDifficulty, string> = {
  orientation: "#06d6d6",
  "command-drill": "#3b82f6",
  "command-inference": "#22c55e",
  "output-reading": "#f0a830",
  "single-troubleshoot": "#a855f7",
  "multi-troubleshoot": "#ec4899",
};

type Screen = "browse" | "playing";

// ── Toggle ──

function Toggle({
  left,
  right,
  value,
  onChange,
  accent = "#06d6d6",
}: {
  left: string;
  right: string;
  value: "left" | "right";
  onChange: (v: "left" | "right") => void;
  accent?: string;
}) {
  return (
    <div
      className="inline-flex rounded overflow-hidden"
      style={{ background: "rgba(8,12,22,0.8)", border: "1px solid #141825" }}
    >
      {([
        { label: left, val: "left" as const },
        { label: right, val: "right" as const },
      ]).map((o, i) => (
        <button
          key={o.val}
          type="button"
          aria-pressed={value === o.val}
          onClick={() => onChange(o.val)}
          className="relative mono transition-all duration-200 max-md:min-h-[44px] max-md:min-w-[44px]"
          style={{
            padding: "4px 10px",
            border: "none",
            cursor: "pointer",
            borderRight: i === 0 ? "1px solid #141825" : "none",
            background: value === o.val ? `${accent}10` : "transparent",
            fontSize: 11,
            color: value === o.val ? accent : "var(--color-v2-text-muted)",
            letterSpacing: "0.06em",
          }}
        >
          {value === o.val && (
            <div
              className="absolute bottom-0 left-[15%] right-[15%] h-px"
              style={{ background: accent, boxShadow: `0 0 4px ${accent}50` }}
            />
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Stat circle with SVG arc fill + warm glow ──

function StatCircle({
  value,
  label,
  color,
  fill = 0,
}: {
  value: string | number;
  label: string;
  color: string;
  /** 0–1 fraction for the ring fill arc */
  fill?: number;
}) {
  // SVG ring geometry (viewBox 0 0 48 48, center 24,24)
  const r = 20; // ring radius
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(Math.max(fill, 0), 1));

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-10 h-10 2xl:w-14 2xl:h-14">
        {/* SVG ring layer */}
        <svg
          viewBox="0 0 48 48"
          className="absolute inset-0 w-full h-full"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Warm glow filter */}
          <defs>
            <filter id={`glow-${label}`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Track ring */}
          <circle
            cx={24} cy={24} r={r}
            fill="none"
            stroke={`${color}15`}
            strokeWidth={2}
          />
          {/* Fill arc — smooth animated ring */}
          {fill > 0 && (
            <circle
              cx={24} cy={24} r={r}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              filter={`url(#glow-${label})`}
              opacity={0.8}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          )}
        </svg>
        {/* Center value */}
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center mono text-xs 2xl:text-base font-bold"
          style={{
            background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
            color,
            textShadow: `0 0 8px ${color}40`,
          }}
        >
          {value}
        </div>
      </div>
      <span
        className="mono text-[10px] 2xl:text-[11px] tracking-[0.12em] mt-1"
        style={{ color: "var(--color-v2-text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════

export default function BattleStationPage() {
  const [screen, setScreen] = useState<Screen>("browse");
  const [activeQueue, setActiveQueue] = useState<TicketScenario[]>([]);
  const [activeQueueIdx, setActiveQueueIdx] = useState(0);
  const [activeSectorIdx, setActiveSectorIdx] = useState(0);
  const [hoveredSector, setHoveredSector] = useState<number | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const [terminalKey, setTerminalKey] = useState(0);
  const [randomMode, setRandomMode] = useState(false);
  const [randomTicket, setRandomTicket] = useState<TicketScenario | null>(null);

  // Settings toggles
  const [orderMode, setOrderMode] = useState<"left" | "right">("left");
  const [loopMode, setLoopMode] = useState<"left" | "right">("left");

  const activeTicket = randomMode ? randomTicket : (activeQueue[activeQueueIdx] ?? null);
  const activeDifficulty = TICKET_DIFFICULTIES[activeSectorIdx] ?? "orientation";
  const sectorColor = SECTOR_COLORS[activeDifficulty];

  // Convex hooks
  const ticketHistory = (useQuery(api.forgeTicketHistory.getAll, {}) ?? []) as Doc<TicketHistoryFields>[];
  const addHistory = useMutation(api.forgeTicketHistory.add);
  const addPoints = useMutation(api.forgeProfile.addPoints);
  const checkBadges = useMutation(api.forgeProfile.checkAndAwardBadges);

  // Stats
  const totalCompleted = new Set(ticketHistory.map((h) => h.ticketId)).size;
  const totalXp = ticketHistory.reduce((sum, h) => sum + (h.xpEarned ?? 0), 0);
  const avgScore = ticketHistory.length > 0
    ? Math.round(ticketHistory.reduce((sum, h) => sum + h.score, 0) / ticketHistory.length)
    : 0;

  // Best scores per ticket
  const bestScores = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of ticketHistory) {
      if (!map[h.ticketId] || h.score > map[h.ticketId]) {
        map[h.ticketId] = h.score;
      }
    }
    return map;
  }, [ticketHistory]);

  // Tickets for active difficulty
  const activeTickets = getTicketsByDifficulty(activeDifficulty);

  // Build radar categories for all difficulties
  const radarCategories: RadarCategory[] = useMemo(
    () =>
      TICKET_DIFFICULTIES.map((d) => {
        const tickets = getTicketsByDifficulty(d);
        const level = TICKET_LEVELS[d];
        return {
          id: d,
          label: level.label.toUpperCase(),
          color: SECTOR_COLORS[d],
          total: tickets.length,
          done: tickets.filter((t) => bestScores[t.id] !== undefined).length,
          items: tickets.map((t) => ({ id: t.id, done: bestScores[t.id] !== undefined })),
        };
      }),
    [bestScores],
  );

  const totalItems = TICKET_SCENARIOS.length;

  // ── Actions ──

  const startTicket = useCallback(
    (ticket: TicketScenario) => {
      const isRandom = orderMode === "right";
      if (isRandom) {
        setRandomMode(true);
        setRandomTicket(ticket);
      } else {
        const idx = activeTickets.findIndex((t) => t.id === ticket.id);
        const queue = idx >= 0 ? activeTickets.slice(idx) : [ticket];
        setActiveQueue(queue);
        setActiveQueueIdx(0);
        setRandomMode(false);
      }
      setTerminalKey((k) => k + 1);
      setScreen("playing");
    },
    [activeTickets, orderMode],
  );

  const startSection = useCallback(() => {
    if (activeTickets.length === 0) return;
    const isRandom = orderMode === "right";
    if (isRandom) {
      const ticket = activeTickets[Math.floor(Math.random() * activeTickets.length)];
      setRandomMode(true);
      setRandomTicket(ticket);
    } else {
      setActiveQueue(activeTickets);
      setActiveQueueIdx(0);
      setRandomMode(false);
    }
    setTerminalKey((k) => k + 1);
    setScreen("playing");
  }, [activeTickets, orderMode]);

  const pickRandom = useCallback(
    (exclude?: string) => {
      const pool = activeTickets.filter((t) => t.id !== exclude);
      return pool[Math.floor(Math.random() * pool.length)];
    },
    [activeTickets],
  );

  const isLastInQueue = !randomMode && activeQueueIdx >= activeQueue.length - 1;

  const persistResult = async (result: TicketAttemptResult) => {
    try {
      await addHistory({
        ticketId: result.ticketId,
        difficulty: result.difficulty,
        score: result.score,
        commandsUsed: result.commandsUsed,
        answer: result.answer,
        usedHint: result.usedHint,
        xpEarned: result.xpEarned,
        timeMs: result.timeMs,
      });
      await addPoints({ points: result.xpEarned });
      await checkBadges({});
    } catch {
      // Silently handle
    }
  };

  const handleNext = async (result: TicketAttemptResult) => {
    await persistResult(result);
    if (randomMode) {
      if (loopMode === "right") {
        const next = pickRandom(result.ticketId);
        setRandomTicket(next);
        setTerminalKey((k) => k + 1);
      } else {
        setScreen("browse");
        setRandomMode(false);
      }
    } else {
      if (activeQueueIdx < activeQueue.length - 1) {
        setActiveQueueIdx((i) => i + 1);
        setTerminalKey((k) => k + 1);
      } else if (loopMode === "right") {
        // Loop: restart queue
        setActiveQueueIdx(0);
        setTerminalKey((k) => k + 1);
      } else {
        setScreen("browse");
      }
    }
  };

  const handleFinishSection = async (result: TicketAttemptResult) => {
    await persistResult(result);
    if (loopMode === "right") {
      // Loop mode: restart
      if (randomMode) {
        const next = pickRandom(result.ticketId);
        setRandomTicket(next);
        setTerminalKey((k) => k + 1);
      } else {
        setActiveQueueIdx(0);
        setTerminalKey((k) => k + 1);
      }
    } else {
      setScreen("browse");
      setRandomMode(false);
    }
  };

  // ── Playing screen ──
  if (screen === "playing" && activeTicket) {
    return (
      <div className="h-below-chrome bg-v2-bg-deep flex flex-col">
        <TicketTerminal
          key={terminalKey}
          ticket={activeTicket}
          isLastInQueue={!randomMode && loopMode !== "right" && isLastInQueue}
          queuePosition={randomMode ? undefined : activeQueueIdx + 1}
          queueTotal={randomMode ? undefined : activeQueue.length}
          randomMode={randomMode}
          onComplete={isLastInQueue && loopMode !== "right" ? handleFinishSection : handleNext}
          onQuit={() => { setRandomMode(false); setScreen("browse"); }}
        />
      </div>
    );
  }

  // ── Browse screen — Radar Design ──

  const cat = radarCategories[activeSectorIdx];

  return (
    <div
      // From md the screen is fixed-height with the radar beside the ticket
      // list. On a phone the two stack and the page scrolls: side by side, the
      // radar overflowed a 181px column and the list got 158px.
      className="w-full md:h-below-chrome md:overflow-hidden max-md:min-h-[calc(100dvh-var(--chrome-h))] flex flex-col"
      style={{ background: "#03040a", fontFamily: "'IBM Plex Sans', sans-serif", color: "#e0e4ec" }}
    >
      {/* Header — compact on small windows */}
      <div className="flex justify-between items-center px-4 2xl:px-7 pt-3 2xl:pt-5 shrink-0">
        <div>
          <div
            className="display-font text-sm 2xl:text-xl tracking-[0.08em]"
            style={{ color: "#e0e4ec" }}
          >
            BATTLESTATION
          </div>
          <div className="text-[11px] 2xl:text-[12px] mt-0.5" style={{ color: "#b8c8e0" }}>
            Live ticket simulator — resolve tickets before they take down the fleet
          </div>
        </div>
        <div className="flex gap-3 2xl:gap-6">
          <StatCircle value={totalCompleted} label="RESOLVED" color="#06d6d6" fill={totalItems > 0 ? totalCompleted / totalItems : 0} />
          <StatCircle value={avgScore ? `${avgScore}%` : "—"} label="SCORE" color="#22c55e" fill={avgScore / 100} />
          <StatCircle value={totalXp} label="XP" color="#f0a830" fill={Math.min(totalXp / 500, 1)} />
        </div>
      </div>

      {/* Main: Radar + Command List */}
      <div className="flex-1 flex flex-col md:flex-row gap-1 2xl:gap-2 px-4 2xl:px-7 pb-3 2xl:pb-5 min-h-0 pt-1 2xl:pt-2">
        {/* Radar — fluid width, square aspect */}
        <div className="md:flex-[5] min-w-0 min-h-0 max-md:h-[min(88vw,360px)] max-md:shrink-0">
          <RadarCanvas
            categories={radarCategories}
            activeIdx={activeSectorIdx}
            onSelectSector={setActiveSectorIdx}
            hoveredSector={hoveredSector}
            onHoverSector={setHoveredSector}
            totalDone={totalCompleted}
            totalItems={totalItems}
          />
        </div>

        {/* Command list panel */}
        <div
          className="md:flex-[4] flex flex-col min-h-0 min-w-0 md:pl-3 2xl:pl-5 max-md:pt-3"
          style={{ borderLeft: `1px solid ${sectorColor}12` }}
        >
          {/* Section header */}
          <div className="flex items-center gap-2 mb-1 shrink-0">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: sectorColor,
                opacity: 0.4,
                boxShadow: `0 0 10px ${sectorColor}30`,
              }}
            />
            <span
              className="display-font text-xs 2xl:text-[15px] font-semibold"
              style={{ color: sectorColor }}
            >
              {TICKET_LEVELS[activeDifficulty].label.toUpperCase()}
            </span>
            <span className="mono text-[10px] 2xl:text-[11px]" style={{ color: "var(--color-v2-text-muted)" }}>
              {cat?.done ?? 0}/{cat?.total ?? 0}
            </span>
          </div>

          {/* Description */}
          <div className="text-[11px] 2xl:text-[12px] mb-2 shrink-0" style={{ color: "var(--color-v2-text-muted)" }}>
            {TICKET_LEVELS[activeDifficulty].description}
          </div>

          {/* Progress segments */}
          <div className="flex gap-0.5 mb-2 shrink-0">
            {activeTickets.map((ticket) => {
              const isDone = bestScores[ticket.id] !== undefined;
              return (
                <div
                  key={ticket.id}
                  className="flex-1 h-[3px] rounded-sm"
                  style={{
                    background: isDone ? sectorColor : "#0a0e18",
                    opacity: isDone ? 0.6 : 1,
                    boxShadow: isDone ? `0 0 4px ${sectorColor}30` : "none",
                  }}
                />
              );
            })}
          </div>

          {/* Ticket list — scrollable */}
          <div className="flex-1 flex flex-col gap-0.5 min-h-0 overflow-y-auto">
            {activeTickets.map((ticket, i) => {
              const best = bestScores[ticket.id];
              const isDone = best !== undefined;
              const isHov = hoveredItem === ticket.id;
              return (
                <button
                  key={ticket.id}
                  onClick={() => startTicket(ticket)}
                  onMouseEnter={() => setHoveredItem(ticket.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex items-center gap-2 2xl:gap-3 text-left rounded transition-all duration-150 cursor-pointer shrink-0 max-md:min-h-[44px]"
                  style={{
                    padding: "4px 8px",
                    background: isHov ? `${sectorColor}06` : "transparent",
                  }}
                >
                  {/* Index */}
                  <span className="mono text-[10px] 2xl:text-[11px] w-3 text-right" style={{ color: "var(--color-v2-text-muted)" }}>
                    {i + 1}
                  </span>

                  {/* Completion dot */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0 transition-all duration-200"
                    style={{
                      background: isDone ? sectorColor : "transparent",
                      border: isDone ? "none" : `1.5px solid ${isHov ? sectorColor + "50" : "#1e2235"}`,
                      boxShadow: isDone ? `0 0 6px ${sectorColor}40` : "none",
                    }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[11px] 2xl:text-xs font-medium truncate"
                      style={{
                        color: isDone ? "var(--color-v2-text-muted)" : "#e0e4ec",
                        textDecorationLine: isDone ? "line-through" : "none",
                        textDecorationColor: "var(--color-v2-text-muted)",
                        textDecorationStyle: "solid",
                      }}
                    >
                      {ticket.title}
                    </div>
                    <div
                      className="text-[11px] 2xl:text-[12px] overflow-hidden transition-all duration-200 leading-snug"
                      style={{
                        color: "var(--color-v2-text-muted)",
                        maxHeight: isHov ? 60 : 0,
                      }}
                    >
                      {ticket.ticket.split("\n")[0]}
                    </div>
                  </div>

                  {/* XP */}
                  <span
                    className="mono text-[11px] shrink-0"
                    style={{ color: sectorColor, opacity: isDone ? 0.7 : 1 }}
                  >
                    {ticket.xpReward}xp
                  </span>

                  {/* Arrow on hover */}
                  <div
                    className="w-4 mono text-[10px] transition-opacity duration-150"
                    style={{
                      opacity: isHov && !isDone ? 1 : 0,
                      color: sectorColor,
                    }}
                  >
                    →
                  </div>
                </button>
              );
            })}

            {activeTickets.length === 0 && (
              <div className="text-center py-12 text-sm" style={{ color: "var(--color-v2-text-muted)" }}>
                No tickets at this difficulty level.
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div
            className="mt-2 pt-2 flex items-center gap-3 2xl:gap-4 shrink-0 flex-wrap"
            style={{ borderTop: "1px solid #0e1420" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="mono text-[10px] 2xl:text-[11px] tracking-[0.1em]" style={{ color: "var(--color-v2-text-muted)" }}>
                ORDER
              </span>
              <Toggle
                left="SEQ"
                right="RNG"
                value={orderMode}
                onChange={setOrderMode}
                accent={sectorColor}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="mono text-[10px] 2xl:text-[11px] tracking-[0.1em]" style={{ color: "var(--color-v2-text-muted)" }}>
                LOOP
              </span>
              <Toggle
                left="ONCE"
                right="LOOP"
                value={loopMode}
                onChange={setLoopMode}
                accent={sectorColor}
              />
            </div>
            <div className="flex-1" />
            <button
              onClick={startSection}
              className="mono text-[11px] 2xl:text-[12px] font-semibold tracking-[0.1em] cursor-pointer max-md:min-h-[44px]"
              style={{
                padding: "6px 14px",
                background: `linear-gradient(135deg, ${sectorColor}14, ${sectorColor}08)`,
                border: `1px solid ${sectorColor}30`,
                borderRadius: 3,
                color: sectorColor,
                boxShadow: `0 0 16px ${sectorColor}10`,
              }}
            >
              {orderMode === "right" ? "RANDOM" : "START"} {TICKET_LEVELS[activeDifficulty].label.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
