"use client";

import { useEffect, useState, useCallback } from "react";
import { BADGE_DEFS } from "@/lib/types";

interface BadgeNotification {
  id: string;
  badgeId: string;
  name: string;
  condition: string;
}

const BADGE_ICONS: Record<string, string> = {
  anvil: "🔨", card: "🃏", zap: "⚡", check: "✅", compass: "🧭", brain: "🧠",
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
};

export default function BadgeBanner() {
  const [queue, setQueue] = useState<BadgeNotification[]>([]);
  const [current, setCurrent] = useState<BadgeNotification | null>(null);

  const handleBadgeEvent = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.trigger !== "badge-earned") return;
    const badgeId = detail?.meta?.badge;
    if (!badgeId) return;
    const def = BADGE_DEFS.find((b) => b.id === badgeId);
    if (!def) return;

    const notification: BadgeNotification = {
      id: `${badgeId}-${Date.now()}`,
      badgeId,
      name: def.name,
      condition: def.condition,
    };

    setQueue((prev) => [...prev, notification]);
  }, []);

  useEffect(() => {
    window.addEventListener("mascot-trigger", handleBadgeEvent);
    return () => window.removeEventListener("mascot-trigger", handleBadgeEvent);
  }, [handleBadgeEvent]);

  // Process queue — show one banner at a time
  useEffect(() => {
    if (current || queue.length === 0) return;

    // Check if this is actually a badge-earned event
    const next = queue[0];
    setCurrent(next);
    setQueue((prev) => prev.slice(1));

    const timer = setTimeout(() => {
      setCurrent(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [queue, current]);

  const icon = current
    ? BADGE_ICONS[BADGE_DEFS.find((b) => b.id === current.badgeId)?.icon ?? ""] ?? "🏆"
    : null;

  // The live region stays mounted (empty and inert) so a screen reader
  // announces the banner when it is inserted.
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4 pt-4"
    >
      {current && (
      <div
        key={current.id}
        className="badge-banner pointer-events-auto max-w-md w-full"
      >
        <div className="badge-shimmer bg-v2-bg-surface border-2 border-v2-cyan/50 rounded-xl px-6 py-4 shadow-2xl shadow-v2-cyan/20">
          <div className="flex items-center gap-4">
            <div className="badge-icon-pop text-3xl shrink-0" aria-hidden="true">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-v2-cyan mono mb-0.5">
                Badge Earned
              </p>
              <p className="text-base font-bold text-v2-text truncate">
                {current.name}
              </p>
              <p className="text-xs text-v2-text-dim truncate">
                {current.condition}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
