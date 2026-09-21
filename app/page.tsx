"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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
