"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import { ALL_CAMPAIGNS, getMissionsForCampaign, ALL_SECTORS } from "@/lib/seeds/campaigns";
import type { Sector, SectorProgress, MissionStatus } from "@/lib/types/campaign";
import StarfieldCanvas from "@/components/star-map/starfield-canvas";
import ScanOverlay from "@/components/ui/scan-overlay";
import GalaxyHeader from "./galaxy-header";
import SectorNode from "./sector-node";

import SectorPreviewPanel from "./sector-preview-panel";
import StatsPanel from "./stats-panel";

/** Animated energy particles flowing along a bezier curve */
function EnergyStream({
  x1, y1, x2, y2, color, active,
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; active: boolean;
}) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  // Control points offset perpendicular to the line
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;
  const curve = len * 0.2;
  const cp1x = x1 + dx * 0.3 + nx * curve;
  const cp1y = y1 + dy * 0.3 + ny * curve;
  const cp2x = x1 + dx * 0.7 - nx * curve * 0.5;
  const cp2y = y1 + dy * 0.7 - ny * curve * 0.5;

  const pathD = `M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
  const pathId = `stream-${x1}-${y1}-${x2}-${y2}`;

  return (
    <g>
      {/* Base path — subtle glow line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={active ? 1.2 : 0.6}
        opacity={active ? 0.25 : 0.08}
        strokeLinecap="round"
      />
      {/* Glow layer */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={active ? 4 : 2}
        opacity={active ? 0.06 : 0.02}
        strokeLinecap="round"
      />
      {/* Animated particles — 3 particles per stream */}
      {[0, 1, 2].map((i) => (
        <circle key={i} r={active ? 2 : 1.2} fill={color} opacity={active ? 0.7 : 0.3}>
          <animateMotion
            dur={`${3 + i * 1.5}s`}
            repeatCount="indefinite"
            begin={`${i * 1.2}s`}
            path={pathD}
          />
          <animate
            attributeName="opacity"
            values={active ? "0;0.7;0.7;0" : "0;0.3;0.3;0"}
            dur={`${3 + i * 1.5}s`}
            repeatCount="indefinite"
            begin={`${i * 1.2}s`}
          />
        </circle>
      ))}
    </g>
  );
}

import type { Doc, CampaignProgressFields, MissionProgressFields, ProfileFields, ProgressFields } from "@/lib/data/schema";

interface GalaxyMapProps {
  /** Set by the first-run tour to hold a sector's preview open without a hover. */
  tourSectorId?: string | null;
}

export default function GalaxyMap({ tourSectorId = null }: GalaxyMapProps) {
  const router = useRouter();
  const profile = useQuery<Doc<ProfileFields> | null>(api.forgeProfile.get);
  const campaignStates = useQuery<Doc<CampaignProgressFields>[]>(api.forgeCampaigns.getAllCampaignStates);
  const missionStates = useQuery<Doc<MissionProgressFields>[]>(api.forgeMissions.getAllMissionStates);
  const topicProgress = useQuery<Doc<ProgressFields>[]>(api.forgeProgress.getAll);

  const [hoveredSector, setPreviewSector] = useState<Sector | null>(null);
  const previewSector =
    (tourSectorId ? ALL_SECTORS.find((s) => s.id === tourSectorId) : null) ?? hoveredSector;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoading = !profile || !campaignStates || !missionStates;

  // Build mission status lookup
  const missionStatusMap: Record<string, MissionStatus> = useMemo(() => {
    const map: Record<string, MissionStatus> = {};
    if (missionStates) {
      for (const ms of missionStates) {
        map[ms.missionId] = ms.status as MissionStatus;
      }
    }
    return map;
  }, [missionStates]);

  // Compute sector progress
  const sectorProgressMap: Record<string, SectorProgress> = useMemo(() => {
    const map: Record<string, SectorProgress> = {};
    for (const sector of ALL_SECTORS) {
      let totalMissions = 0;
      let completedMissions = 0;
      let activeCampaignId: string | null = null;
      let hasVolunteered = false;

      for (const cid of sector.campaignIds) {
        const campaign = ALL_CAMPAIGNS.find((c) => c.id === cid);
        if (!campaign) continue;
        const missions = getMissionsForCampaign(cid);
        totalMissions += missions.length;

        const campaignState = campaignStates?.find((cs) => cs.campaignId === cid);
        if (campaignState?.enrolled) {
          hasVolunteered = true;
          activeCampaignId = cid;
        }

        for (const m of missions) {
          if (missionStatusMap[m.id] === "accomplished") {
            completedMissions++;
          }
        }
      }

      map[sector.id] = {
        sectorId: sector.id,
        totalMissions,
        completedMissions,
        activeCampaignId,
        hasVolunteered,
        isComplete: totalMissions > 0 && completedMissions === totalMissions,
      };
    }
    return map;
  }, [campaignStates, missionStatusMap]);

  // Derived stats
  const totalMissions = Object.values(sectorProgressMap).reduce((s, p) => s + p.totalMissions, 0);
  const totalAccomplished = Object.values(sectorProgressMap).reduce((s, p) => s + p.completedMissions, 0);
  const sectorsExplored = Object.values(sectorProgressMap).filter((p) => p.hasVolunteered).length;

  // Active campaign info for stats panel
  const enrolledState = campaignStates?.find((c) => c.enrolled);
  const activeCampaign = enrolledState
    ? ALL_CAMPAIGNS.find((c) => c.id === enrolledState.campaignId)
    : undefined;
  const activeCampaignMissions = activeCampaign
    ? getMissionsForCampaign(activeCampaign.id)
    : [];
  const activeCampaignCompleted = activeCampaignMissions.filter(
    (m) => missionStatusMap[m.id] === "accomplished"
  ).length;
  const activeCampaignPct = activeCampaignMissions.length > 0
    ? Math.round((activeCampaignCompleted / activeCampaignMissions.length) * 100)
    : undefined;

  const handleSectorHover = useCallback((sector: Sector | null) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (sector) {
      setPreviewSector(sector);
    } else {
      hideTimerRef.current = setTimeout(() => {
        setPreviewSector(null);
      }, 300);
    }
  }, []);

  const handleSectorClick = useCallback((sector: Sector) => {
    const campaignId = sector.campaignIds[0];
    if (!campaignId) return;
    router.push(`/missions?campaign=${campaignId}`);
  }, [router]);

  const handlePanelEnter = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const handlePanelLeave = useCallback(() => {
    hideTimerRef.current = setTimeout(() => {
      setPreviewSector(null);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Energy stream connections
  const lanes: [Sector, Sector][] = useMemo(() => {
    const s = (id: string) => ALL_SECTORS.find((sec) => sec.id === id)!;
    return [
      [s("sector-linux"), s("sector-hardware")],
      [s("sector-linux"), s("sector-networking")],
      [s("sector-hardware"), s("sector-power")],
      [s("sector-networking"), s("sector-fiber")],
      [s("sector-networking"), s("sector-scale")],
      [s("sector-ops"), s("sector-linux")],
      [s("sector-ops"), s("sector-power")],
      [s("sector-linux"), s("sector-linux-advanced")],
    ];
  }, []);

  return (
    <div className="h-[calc(100vh-var(--chrome-h))] w-full relative overflow-hidden">
      {/* Starfield background */}
      <StarfieldCanvas />
      <ScanOverlay />

      {/* Cockpit viewport vignette */}
      <div className="viewport-vignette fixed inset-0 z-[8] pointer-events-none" />

      {/* Galaxy header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <GalaxyHeader />
      </div>

      {/* Main layout: map (65%) + stats (35%) */}
      <div className="absolute inset-0 z-[5] flex flex-col md:flex-row pt-14 pb-3 px-3 gap-3">
        {/* Galaxy map — glass panel */}
        <div className="flex-1 relative flex flex-col min-w-0 min-h-0">
          <div className="glass-panel-header">
            <span>Sector Map</span>
          </div>
          <div className="flex-1 glass-panel rounded-b-lg overflow-hidden galaxy-map-panel">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[#8eafc8] text-sm telemetry-font animate-pulse">
                  Scanning galaxy sectors...
                </div>
              </div>
            ) : (
              <svg
                viewBox="0 0 1000 800"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full relative z-[1]"
              >
                {/* Energy streams between sectors */}
                {lanes.map(([a, b], i) => {
                  const aProgress = sectorProgressMap[a.id];
                  const bProgress = sectorProgressMap[b.id];
                  const bothActive = aProgress?.hasVolunteered && bProgress?.hasVolunteered;
                  return (
                    <EnergyStream
                      key={i}
                      x1={a.mapPosition.x * 10}
                      y1={a.mapPosition.y * 10}
                      x2={b.mapPosition.x * 10}
                      y2={b.mapPosition.y * 10}
                      color="#06d6d6"
                      active={bothActive}
                    />
                  );
                })}

                {/* Sector nodes */}
                {ALL_SECTORS.map((sector) => (
                  <SectorNode
                    key={sector.id}
                    sector={sector}
                    progress={sectorProgressMap[sector.id]}
                    onHover={handleSectorHover}
                    onClick={handleSectorClick}
                  />
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* Right sidebar — Navigation Board (default) or Sector Preview (on hover) */}
        <div
          data-tour="sector-panel"
          className="md:w-[280px] lg:w-[320px] xl:w-[340px] shrink-0 flex flex-col min-h-0 max-h-[40vh] md:max-h-none"
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
        >
          <div className="glass-panel-header">
            <span>{previewSector ? "Sector Preview" : "Navigation Board"}</span>
          </div>
          <div className="flex-1 glass-panel rounded-b-lg overflow-hidden">
            {previewSector ? (
              <SectorPreviewPanel
                sector={previewSector}
                progress={sectorProgressMap[previewSector.id]}
                missionStatuses={missionStatusMap}
              />
            ) : (
              <StatsPanel
                totalXp={profile?.totalPoints ?? 0}
                streak={profile?.streak ?? 0}
                sectorsExplored={sectorsExplored}
                totalSectors={ALL_SECTORS.length}
                missionsAccomplished={totalAccomplished}
                totalMissions={totalMissions}
                activeCampaignTitle={activeCampaign?.title}
                activeCampaignPct={activeCampaignPct}
                topicProgress={topicProgress ?? []}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
