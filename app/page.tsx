"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { TOPICS } from "@/lib/types";
import { useReseedCards, useRecomputeProgress } from "@/lib/convex-hooks";
import { getAllSeedCards } from "@/lib/seeds";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { clearTourRequest, isTourRequested, subscribeToTourRequest } from "@/lib/tour/request";
import Onboarding, { isOnboardingDone } from "@/components/onboarding";
import GalaxyMap from "@/components/galaxy-map/galaxy-map";

export default function Dashboard() {
  const [firstRun, setFirstRun] = useState(false);
  const [tourSectorId, setTourSectorId] = useState<string | null>(null);
  // "? Guide" in the nav asks for a replay; no reload needed.
  const replayRequested = useSyncExternalStore(subscribeToTourRequest, isTourRequested, () => false);

  useEffect(() => {
    if (!isOnboardingDone()) setFirstRun(true);
  }, []);

  const reseedCards = useReseedCards();
  const recomputeProgress = useRecomputeProgress();
  const [seeding, setSeeding] = useState(false);

  // Card-content reseed: bump RESEED_VERSION when card text/structure changes to
  // push updates out without blowing away per-card review progress.
  const RESEED_VERSION = 4;
  useEffect(() => {
    if (seeding) return;
    if (typeof window === "undefined") return;
    const applied = Number(localStorage.getItem(STORAGE_KEYS.reseedVersion) ?? -1);
    if (applied >= RESEED_VERSION) return;
    const doReseed = async () => {
      setSeeding(true);
      const allCards = getAllSeedCards();
      for (let i = 0; i < allCards.length; i += 50) {
        const batch = allCards.slice(i, i + 50).map((c) => ({
          cardId: c.id, topicId: c.topicId, type: c.type,
          front: c.front, back: c.back, difficulty: c.difficulty,
          tier: c.tier, steps: c.steps, sortOrder: c.sortOrder,
          easeFactor: c.easeFactor,
          interval: c.interval, repetitions: c.repetitions,
          dueDate: c.dueDate, lastReview: c.lastReview ?? undefined,
        }));
        await reseedCards({ cards: batch });
      }
      for (const t of TOPICS) {
        await recomputeProgress({ topicId: t.id });
      }
      localStorage.setItem(STORAGE_KEYS.reseedVersion, String(RESEED_VERSION));
      setSeeding(false);
    };
    doReseed();
  }, [seeding, reseedCards, recomputeProgress]);

  if (seeding) {
    return (
      <div className="h-[calc(100vh-var(--chrome-h))] w-full flex items-center justify-center">
        <span className="telemetry-font text-v2-cyan animate-pulse tracking-wider">
          Initializing ship systems...
        </span>
      </div>
    );
  }

  // The tour is an overlay: the map stays on screen behind it.
  return (
    <>
      <GalaxyMap tourSectorId={tourSectorId} />
      {(firstRun || replayRequested) && (
        <Onboarding
          onFocusSector={setTourSectorId}
          onComplete={() => {
            setFirstRun(false);
            clearTourRequest();
          }}
        />
      )}
    </>
  );
}
