"use client";

import { useCallback, useEffect, useState } from "react";
import { BADGE_DEFS } from "@/lib/types";
import { useReducedMotion } from "@/lib/use-reduced-motion";

// Badge unlocked. A card in the upper middle of the screen: the badge in its
// hex, a ring that bursts outward, sparks in the fleet's colours, the name and
// what it was for. A few seconds, or a click, and it is gone; one at a time,
// so a session that earns three shows three. The mutation that awards a badge
// fires the event (lib/data/operations.ts) — no screen has to remember to.
//
// Reduced motion cuts every animation here to its last frame, which for the
// card is "visible", so it simply appears; the sparks and ring are skipped.

interface BadgeNotification {
  id: string;
  badgeId: string;
  name: string;
  condition: string;
  icon: string;
}

const BADGE_ICONS: Record<string, string> = {
  anvil: "🔨", card: "🃏", zap: "⚡", check: "✅", compass: "🧭", brain: "🧠", ribbon: "🎖️",
  seedling: "🌱", leaf: "🌿", tree: "🌳", oak: "🌲", shark: "🦈", gear: "⚙️",
  coin: "🪙", coins: "💰", "trophy-bronze": "🥉", "trophy-gold": "🏆",
  "flame-spark": "🔥", "flame-silver": "🔥", "flame-bronze": "🔥", "flame-gold": "🔥",
  "flame-blue": "💙", "flame-purple": "💜",
  lightning: "⚡", fire: "🔥", meteor: "☄️", "star-5": "⭐", repeat: "🔁", rocket: "🚀",
  calendar: "📅", target: "🎯", medal: "🏅",
  "terminal-green": "💻", terminal: "💻", "wifi-green": "📡", wifi: "📡",
  "wrench-green": "🔧", wrench: "🔧", "half-star": "⭐", globe: "🌍", scales: "⚖️",
  crosshair: "🎯", signal: "📶", star: "⭐", bolt: "⚡", chain: "⛓️",
  "arrow-up": "⬆️", "arrow-up-2": "⏫", diamond: "💎",
  siren: "🚨", shield: "🛡️", "shield-star": "🛡️", bullseye: "🎯", "thumbs-up": "👍", rotate: "🔄",
};

export const SHOW_MS = 3800;
const LEAVE_MS = 300;
const SPARKS = 16;
const SPARK_COLOURS = ["var(--color-v2-cyan)", "var(--color-v2-amber)", "var(--color-v2-green)", "var(--color-v2-purple)"];

// Fixed by index, not random: the same card renders the same way every time.
const sparks = Array.from({ length: SPARKS }, (_, i) => ({
  angle: i * (360 / SPARKS) + (i % 2 ? 11 : -7),
  distance: 72 + ((i * 37) % 48),
  delay: (i * 23) % 180,
  colour: SPARK_COLOURS[i % SPARK_COLOURS.length],
}));

export function BadgeCard({
  badge,
  icon,
  more,
  leaving,
  reducedMotion,
  onDismiss,
}: {
  badge: { name: string; condition: string };
  icon: string;
  /** How many more are queued behind this one. */
  more: number;
  leaving: boolean;
  reducedMotion: boolean;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`badge-unlock-card${leaving ? " is-leaving" : ""} pointer-events-auto relative w-[300px] max-w-[calc(100vw-32px)] rounded-2xl px-6 pt-7 pb-5 text-center`}
      style={{
        background: "var(--color-v2-bg-elevated)",
        border: "1px solid color-mix(in srgb, var(--color-v2-cyan) 55%, transparent)",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 48px rgba(6, 214, 214, 0.22)",
      }}
    >
      {!reducedMotion && (
        <>
          <span aria-hidden="true" className="badge-ring" />
          {sparks.map((s, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="badge-spark"
              style={{ "--a": `${s.angle}deg`, "--d": `${s.distance}px`, "--t": `${s.delay}ms`, "--c": s.colour } as React.CSSProperties}
            />
          ))}
        </>
      )}
      <div className="badge-hex relative mx-auto mb-3" style={{ width: 88, height: 88 }}>
        <svg viewBox="0 0 32 32" width="88" height="88" aria-hidden="true">
          <polygon points="16 2 28 9 28 23 16 30 4 23 4 9" fill="rgba(6, 214, 214, 0.08)" stroke="var(--color-v2-cyan)" strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points="16 6 24.5 11 24.5 21 16 26 7.5 21 7.5 11" fill="none" stroke="var(--color-v2-cyan)" strokeWidth="0.5" opacity="0.5" />
        </svg>
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-4xl leading-none">{icon}</span>
      </div>
      <p className="mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-v2-amber-bright)" }}>Badge earned</p>
      <p className="display-font text-xl tracking-wider mt-1" style={{ color: "var(--color-v2-cyan)", textShadow: "0 0 18px rgba(6, 214, 214, 0.5)" }}>
        {badge.name}
      </p>
      <p className="text-sm text-v2-text-dim mt-1 leading-snug">{badge.condition}</p>
      {more > 0 && <p className="text-[11px] text-v2-text-muted mt-2">{more} more {more === 1 ? "is" : "are"} on the way</p>}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 px-4 py-1.5 max-md:min-h-[44px] rounded-lg text-[11px] display-font tracking-wider uppercase"
        style={{ color: "var(--color-v2-bg-deep)", background: "var(--color-v2-cyan)" }}
      >
        Continue
      </button>
    </div>
  );
}

export default function BadgeBanner() {
  const [queue, setQueue] = useState<BadgeNotification[]>([]);
  const [current, setCurrent] = useState<BadgeNotification | null>(null);
  const [leaving, setLeaving] = useState(false);
  const reducedMotion = useReducedMotion();

  const handleBadgeEvent = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.trigger !== "badge-earned") return;
    const badgeId = detail?.meta?.badge;
    if (typeof badgeId !== "string") return;
    const def = BADGE_DEFS.find((b) => b.id === badgeId);
    if (!def) return;
    setQueue((prev) => [...prev, { id: `${badgeId}-${Date.now()}`, badgeId, name: def.name, condition: def.condition, icon: BADGE_ICONS[def.icon] ?? "🏆" }]);
  }, []);

  useEffect(() => {
    window.addEventListener("mascot-trigger", handleBadgeEvent);
    return () => window.removeEventListener("mascot-trigger", handleBadgeEvent);
  }, [handleBadgeEvent]);

  // One at a time: take the next when nothing is showing.
  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setLeaving(false);
    setQueue((prev) => prev.slice(1));
  }, [queue, current]);

  // Hold, then leave; leaving takes a moment so the exit can animate.
  useEffect(() => {
    if (!current) return;
    const hold = window.setTimeout(() => setLeaving(true), SHOW_MS);
    return () => window.clearTimeout(hold);
  }, [current]);
  useEffect(() => {
    if (!current || !leaving) return;
    const gone = window.setTimeout(() => setCurrent(null), reducedMotion ? 0 : LEAVE_MS);
    return () => window.clearTimeout(gone);
  }, [current, leaving, reducedMotion]);

  const dismiss = useCallback(() => setLeaving(true), []);
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, dismiss]);

  // The live region stays mounted (empty and inert) so a screen reader
  // announces the card when it is inserted.
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex items-start justify-center pointer-events-none px-4 pt-[14vh]">
      {current && (
        <BadgeCard key={current.id} badge={current} icon={current.icon} more={queue.length} leaving={leaving} reducedMotion={reducedMotion} onDismiss={dismiss} />
      )}
    </div>
  );
}
