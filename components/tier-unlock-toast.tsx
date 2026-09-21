"use client";

import { useState, useEffect } from "react";

interface TierUnlockToastProps {
  topicId: string;
  newTier: number;
  onDismiss: () => void;
}

const TIER_NAMES = ["", "Foundations", "Application", "Scenarios", "Incident Branching"];

export default function TierUnlockToast({ topicId, newTier, onDismiss }: TierUnlockToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] tier-unlock-toast">
      <div className="bg-forge-accent/95 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <span className="text-lg" aria-hidden="true">▲</span>
        <div>
          <span className="font-semibold text-sm block">
            Tier {newTier} Unlocked
          </span>
          <span className="text-xs text-white/80">
            {topicId} — {TIER_NAMES[newTier] ?? ""} cards now available
          </span>
        </div>
      </div>
    </div>
  );
}
