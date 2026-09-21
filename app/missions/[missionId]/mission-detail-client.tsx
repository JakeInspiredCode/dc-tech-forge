"use client";

import { useRouter } from "next/navigation";
import MissionPlayer from "@/components/mission/mission-player";
import { getMission } from "@/lib/seeds/campaigns";
import ScanOverlay from "@/components/ui/scan-overlay";

export default function MissionDetailClient({ missionId }: { missionId: string }) {
  const router = useRouter();
  const mission = getMission(missionId);

  if (!mission) {
    return (
      <>
        <div className="relative min-h-screen bg-v2-bg-deep">
          <ScanOverlay />
          <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 text-center">
            <h1 className="display-font text-xl text-v2-warning mb-2">
              Mission Not Found
            </h1>
            <p className="text-sm text-v2-text-dim mb-4">
              Mission &ldquo;{missionId}&rdquo; does not exist.
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-v2-cyan hover:text-v2-cyan-bright text-sm transition-colors"
            >
              ← Return to Galaxy Map
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="relative min-h-screen bg-v2-bg-deep">
        <ScanOverlay />
        <div className="relative z-10 px-4 py-6">
          <MissionPlayer mission={mission} />
        </div>
      </div>
    </>
  );
}
