"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import type { Doc, CampaignProgressFields, MissionProgressFields, ProfileFields } from "@/lib/data/schema";
import { ALL_CAMPAIGNS, getMissionsForCampaign } from "@/lib/seeds/campaigns";
import { getSectorForCampaign } from "@/lib/seeds/sectors";
import { SESSION_KEYS, STORAGE_KEYS } from "@/lib/storage-keys";
import type { Mission, MissionStatus, MissionStep } from "@/lib/types/campaign";
import StarfieldCanvas from "@/components/star-map/starfield-canvas";
import ScanOverlay from "@/components/ui/scan-overlay";
import CentralStar from "./central-star";
import MissionNode from "./mission-node";
import CampaignPath from "./campaign-path";
import MissionPreviewPanel from "./mission-preview-panel";
import StatsSidebar from "./stats-sidebar";

// ── Orbital position computation ──

interface OrbitalPos {
  cx: number;
  cy: number;
  size: number;
  celestialType: "asteroid" | "moon" | "planet" | "station";
}

// Predefined planet profiles — each mission gets a unique look
const PLANET_PROFILES: { size: number; celestialType: OrbitalPos["celestialType"]; orbitMult: number }[] = [
  { size: 10, celestialType: "moon",    orbitMult: 0.28 },   // 1: small rocky
  { size: 13, celestialType: "moon",    orbitMult: 0.38 },   // 2: rocky world
  { size: 18, celestialType: "planet",  orbitMult: 0.48 },   // 3: terrestrial
  { size: 14, celestialType: "planet",  orbitMult: 0.56 },   // 4: mars-like
  { size: 11, celestialType: "moon",    orbitMult: 0.63 },   // 5: small planet
  { size: 24, celestialType: "station", orbitMult: 0.72 },   // 6: gas giant w/ rings
  { size: 20, celestialType: "planet",  orbitMult: 0.80 },   // 7: neptune-like
  { size: 12, celestialType: "moon",    orbitMult: 0.86 },   // 8: ice world
  { size: 16, celestialType: "planet",  orbitMult: 0.91 },   // 9: outer planet
  { size: 9,  celestialType: "moon",    orbitMult: 0.95 },   // 10: dwarf planet
  { size: 13, celestialType: "moon",    orbitMult: 0.98 },   // 11: ice dwarf
  { size: 22, celestialType: "station", orbitMult: 1.0 },    // 12: outer giant
];

function computeOrbitalPositions(count: number): OrbitalPos[] {
  const centerX = 500;
  const centerY = 380;
  const minRadius = 80;
  const maxRadius = 340;

  const positions: OrbitalPos[] = [];

  for (let i = 0; i < count; i++) {
    const profile = PLANET_PROFILES[i % PLANET_PROFILES.length];

    // Sequential orbit — missions progress clockwise from ~10 o'clock
    // Each planet at a slightly different radius for visual variety
    const angle = (i / count) * Math.PI * 2 - Math.PI * 0.6; // start at ~10 o'clock
    const orbitRadius = minRadius + profile.orbitMult * (maxRadius - minRadius);

    const cx = centerX + Math.cos(angle) * orbitRadius;
    const cy = centerY + Math.sin(angle) * orbitRadius;

    positions.push({
      cx,
      cy,
      size: profile.size,
      celestialType: profile.celestialType,
    });
  }

  return positions;
}

// ── Effective mission status ──

function getEffectiveStatus(
  missionId: string,
  missionIndex: number,
  missionStatusMap: Record<string, MissionStatus>,
  enrolled: boolean,
  campaignMissions: Mission[],
): MissionStatus {
  if (missionStatusMap[missionId]) return missionStatusMap[missionId];
  if (!enrolled) return "locked";
  if (missionIndex === 0) return "available";
  const prev = campaignMissions[missionIndex - 1];
  if (prev && missionStatusMap[prev.id] === "accomplished") return "available";
  return "locked";
}

// ── Component ──

export default function SystemMap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignIdParam = searchParams.get("campaign");

  const profile = useQuery<Doc<ProfileFields> | null>(api.forgeProfile.get);
  const campaignStates = useQuery<Doc<CampaignProgressFields>[]>(api.forgeCampaigns.getAllCampaignStates);
  const missionStates = useQuery<Doc<MissionProgressFields>[]>(api.forgeMissions.getAllMissionStates);
  const enrollCampaign = useMutation(api.forgeCampaigns.enrollCampaign);

  // activeHover = what's under the cursor right now (drives cursor tooltip + planet ring/badge)
  // pinnedMission = what the side panel shows; sticky — only changes when a different
  //   mission is hovered, so users can move into the panel and click Deploy/⋯ without
  //   the panel evaporating.
  const [activeHover, setActiveHover] = useState<Mission | null>(null);
  const [pinnedMission, setPinnedMission] = useState<Mission | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Last-visited campaign memory: when Missions is clicked without a ?campaign=
  // param, fall back to whichever campaign the user was last viewing.
  const LAST_CAMPAIGN_KEY = STORAGE_KEYS.lastCampaign;
  const [savedCampaign, setSavedCampaign] = useState<string | null>(null);
  useEffect(() => {
    try {
      setSavedCampaign(localStorage.getItem(LAST_CAMPAIGN_KEY));
    } catch {
      // localStorage unavailable — fall through to data-driven fallback
    }
  }, []);

  const isLoading = !profile || !campaignStates || !missionStates;

  // Resolve active campaign with fallback chain:
  //   URL ?campaign=X → localStorage last-visited → most recent activity → first enrolled
  const activeCampaignId = useMemo(() => {
    if (campaignIdParam) return campaignIdParam;

    const enrolled = campaignStates?.filter((c) => c.enrolled) ?? [];
    if (enrolled.length === 0) return undefined;

    // Tier 1: localStorage last-visited (only if still enrolled)
    if (savedCampaign && enrolled.some((c) => c.campaignId === savedCampaign)) {
      return savedCampaign;
    }

    // Tier 2: most recently active enrolled campaign
    const sorted = [...enrolled].sort((a, b) => {
      const ta = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const tb = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return tb - ta;
    });
    return sorted[0]?.campaignId;
  }, [campaignIdParam, campaignStates, savedCampaign]);

  const activeCampaign = activeCampaignId
    ? ALL_CAMPAIGNS.find((c) => c.id === activeCampaignId)
    : undefined;
  const enrolledState = campaignStates?.find((c) => c.campaignId === activeCampaignId);

  // Persist the resolved campaign so future Missions clicks land here
  useEffect(() => {
    if (!activeCampaignId) return;
    try {
      localStorage.setItem(LAST_CAMPAIGN_KEY, activeCampaignId);
    } catch {
      // ignore
    }
  }, [activeCampaignId]);

  // Reset the pinned preview when the campaign changes (otherwise the sidebar
  // would keep showing a mission from a different campaign)
  useEffect(() => {
    setPinnedMission(null);
    setActiveHover(null);
  }, [activeCampaignId]);

  // Campaign sector for theming
  const sector = activeCampaignId ? getSectorForCampaign(activeCampaignId) : undefined;
  const campaignColor = sector?.color ?? "#f59e0b";

  // Missions for this campaign. Memoized so downstream `useMemo` deps that
  // reference `missions` don't bust on every render.
  const missions = useMemo(
    () => (activeCampaign ? getMissionsForCampaign(activeCampaign.id) : []),
    [activeCampaign],
  );

  // Mission status lookup
  const missionStatusMap: Record<string, MissionStatus> = useMemo(() => {
    const map: Record<string, MissionStatus> = {};
    if (missionStates) {
      for (const ms of missionStates) {
        map[ms.missionId] = ms.status as MissionStatus;
      }
    }
    return map;
  }, [missionStates]);

  // Effective statuses
  const effectiveStatuses: Record<string, MissionStatus> = useMemo(() => {
    const map: Record<string, MissionStatus> = {};
    const enrolled = enrolledState?.enrolled ?? false;
    missions.forEach((m, i) => {
      map[m.id] = getEffectiveStatus(m.id, i, missionStatusMap, enrolled, missions);
    });
    return map;
  }, [missions, missionStatusMap, enrolledState]);

  // Orbital positions
  const orbitalPositions = useMemo(() => computeOrbitalPositions(missions.length), [missions.length]);

  // Current mission index
  const currentMissionIndex = enrolledState?.currentMissionIndex ?? 0;
  const completedCount = enrolledState?.completedMissions.length ?? 0;

  // Campaign-specific XP — sum xpEarned from missions in this campaign
  const campaignXp = useMemo(() => {
    if (!missionStates) return 0;
    const missionIds = new Set(missions.map((m) => m.id));
    return missionStates
      .filter((ms) => missionIds.has(ms.missionId) && typeof ms.xpEarned === "number")
      .reduce((sum, ms) => sum + (ms.xpEarned as number), 0);
  }, [missionStates, missions]);

  // Decaying missions
  const decayingMissionIds = useMemo(
    () =>
      missionStates
        ?.filter(
          (m) =>
            m.status === "decaying" &&
            missions.some((cm) => cm.id === m.missionId),
        )
        .map((m) => m.missionId) ?? [],
    [missionStates, missions],
  );

  // Path nodes for campaign path
  const pathNodes = useMemo(
    () =>
      missions.map((m, i) => ({
        missionId: m.id,
        cx: orbitalPositions[i]?.cx ?? 500,
        cy: orbitalPositions[i]?.cy ?? 380,
      })),
    [missions, orbitalPositions],
  );

  const pinnedMissionNumber = pinnedMission
    ? missions.findIndex((m) => m.id === pinnedMission.id) + 1
    : 0;

  // Hover over a mission node:
  //   - sets activeHover (transient — drives cursor tooltip + planet ring/badge)
  //   - pins the mission in the sidebar (sticky — drives the side panel)
  // Mouseleave clears activeHover but leaves pinnedMission alone, so users
  // can move the cursor off the planet to interact with the sidebar.
  const handleMissionHover = useCallback((mission: Mission | null) => {
    setActiveHover(mission);
    if (mission) setPinnedMission(mission);
  }, []);

  const handleDeploy = useCallback((missionId: string, loadout: MissionStep[]) => {
    sessionStorage.setItem(
      SESSION_KEYS.loadout(missionId),
      JSON.stringify(loadout.map((s) => s.id)),
    );
    router.push(`/missions/${missionId}?autostart=true`);
  }, [router]);

  // Click on a mission node = deploy directly. Standard web norm: cards are
  // clickable and click triggers the action. Hover = preview, click = act.
  const handleMissionClick = useCallback(
    (mission: Mission) => {
      const status = effectiveStatuses[mission.id];
      if (status === "locked") return;
      handleDeploy(mission.id, mission.defaultLoadout);
    },
    [effectiveStatuses, handleDeploy],
  );

  const handleSkipToCheck = useCallback((missionId: string) => {
    router.push(`/missions/${missionId}?skipToCheck=true`);
  }, [router]);

  const handleEnroll = useCallback(async () => {
    if (!activeCampaignId) return;
    await enrollCampaign({ campaignId: activeCampaignId });
  }, [activeCampaignId, enrollCampaign]);

  // Only track mouse position while a mission is actively under the cursor.
  // Without this guard, every idle mouse movement re-renders the whole map.
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!activeHover) return;
      setMousePos({ x: e.clientX, y: e.clientY });
    },
    [activeHover],
  );

  const hasNoCampaign = !isLoading && !activeCampaign;

  return (
    <div className="h-[calc(100vh-var(--chrome-h))] w-full relative overflow-hidden" onMouseMove={handleMouseMove}>
      <StarfieldCanvas />
      <ScanOverlay />

      {/* Cockpit viewport vignette */}
      <div className="viewport-vignette fixed inset-0 z-[8] pointer-events-none" />

      {/* Header — top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="galaxy-header-bar">
          <div className="header-accent-line" />
          <div className="flex items-center gap-3">
            <div className="header-diamond" />
            <h1 className="galaxy-title">
              {activeCampaign ? `Campaign: ${activeCampaign.title.replace(/^Operation\s+/, '')}` : 'Campaign View'}
            </h1>
            <div className="header-diamond" />
          </div>
          <div className="header-accent-line" />
        </div>
      </div>

      {/* Main layout: map + sidebar */}
      <div className="absolute inset-0 z-[5] flex flex-col md:flex-row pt-11 pb-1 px-1 gap-2">
        {/* Solar system SVG — glass panel framed */}
        <div className="flex-1 relative flex flex-col min-w-0 min-h-0">
          <div className="glass-panel-header">
            <span>{activeCampaign ? `System Map — ${activeCampaign.title.replace(/^Operation\s+/, '')}` : 'System Map'}</span>
          </div>
          <div className="flex-1 glass-panel rounded-b-lg overflow-hidden relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[#8eafc8] text-sm telemetry-font animate-pulse">
                  Scanning star system...
                </div>
              </div>
            ) : hasNoCampaign ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[#8eafc8] text-sm telemetry-font">
                  No system selected
                </div>
              </div>
            ) : (
              <svg
                viewBox="110 80 690 680"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full relative z-[1]"
              >
                {/* Ambient nebula glow behind the solar system */}
                <circle
                  cx={500} cy={380} r={360}
                  fill={`url(#system-nebula)`}
                  opacity={0.3}
                  className="sector-breathe"
                  style={{ animationDelay: "500ms" }}
                />
                <circle
                  cx={500} cy={380} r={220}
                  fill={`url(#system-nebula-inner)`}
                  opacity={0.2}
                  className="sector-breathe"
                  style={{ animationDelay: "1200ms" }}
                />

                {/* Campaign path (behind nodes) */}
                <CampaignPath
                  nodes={pathNodes}
                  currentMissionIndex={currentMissionIndex}
                  pathColor={campaignColor}
                />

                {/* Central star */}
                <CentralStar
                  cx={500}
                  cy={380}
                  title={activeCampaign?.title ?? ""}
                  color={campaignColor}
                  completedMissions={completedCount}
                  totalMissions={missions.length}
                />

                {/* Mission nodes */}
                {missions.map((mission, i) => {
                  const pos = orbitalPositions[i];
                  if (!pos) return null;
                  return (
                    <MissionNode
                      key={mission.id}
                      mission={mission}
                      missionIndex={i}
                      totalMissions={missions.length}
                      status={effectiveStatuses[mission.id] ?? "locked"}
                      cx={pos.cx}
                      cy={pos.cy}
                      size={pos.size}
                      celestialType={pos.celestialType}
                      campaignColor={campaignColor}
                      isCurrent={i === currentMissionIndex}
                      isHovered={activeHover?.id === mission.id}
                      enrolled={enrolledState?.enrolled ?? false}
                      onHover={handleMissionHover}
                      onClick={handleMissionClick}
                    />
                  );
                })}

                {/* HUD corner accents */}
                <g opacity={0.15} stroke={campaignColor} strokeWidth={1.2} fill="none">
                  {/* Top-left */}
                  <polyline points="130,110 130,90 150,90" />
                  <line x1="130" y1="90" x2="138" y2="98" opacity={0.4} />
                  {/* Top-right */}
                  <polyline points="780,90 800,90 800,110" />
                  <line x1="800" y1="90" x2="792" y2="98" opacity={0.4} />
                  {/* Bottom-left */}
                  <polyline points="130,740 130,760 150,760" />
                  <line x1="130" y1="760" x2="138" y2="752" opacity={0.4} />
                  {/* Bottom-right */}
                  <polyline points="780,760 800,760 800,740" />
                  <line x1="800" y1="760" x2="792" y2="752" opacity={0.4} />
                </g>

                {/* Nebula gradient definitions */}
                <defs>
                  <radialGradient id="system-nebula" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={campaignColor} stopOpacity={0.15} />
                    <stop offset="35%" stopColor={campaignColor} stopOpacity={0.06} />
                    <stop offset="70%" stopColor={campaignColor} stopOpacity={0.02} />
                    <stop offset="100%" stopColor={campaignColor} stopOpacity={0} />
                  </radialGradient>
                  <radialGradient id="system-nebula-inner" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={campaignColor} stopOpacity={0.25} />
                    <stop offset="50%" stopColor={campaignColor} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={campaignColor} stopOpacity={0} />
                  </radialGradient>
                </defs>
              </svg>
            )}
          </div>
        </div>

        {/* Right sidebar — Mission Briefing (default) or Mission Preview (sticky) */}
        <div className="md:w-[280px] lg:w-[320px] xl:w-[340px] shrink-0 flex flex-col min-h-0 max-h-[40vh] md:max-h-none">
          <div className="glass-panel-header">
            <span>
              {pinnedMission
                ? `Mission ${pinnedMissionNumber}`
                : "Mission Briefing"}
            </span>
          </div>
          <div className="flex-1 glass-panel rounded-b-lg overflow-hidden">
            {pinnedMission ? (
              <MissionPreviewPanel
                mission={pinnedMission}
                status={effectiveStatuses[pinnedMission.id] ?? "locked"}
                missionNumber={pinnedMissionNumber}
                totalMissions={missions.length}
                campaignColor={campaignColor}
                enrolled={enrolledState?.enrolled ?? false}
                onDeploy={handleDeploy}
                onSkipToCheck={handleSkipToCheck}
              />
            ) : (
              <StatsSidebar
                campaign={activeCampaign}
                missions={missions}
                missionStatuses={effectiveStatuses}
                completedCount={completedCount}
                totalMissions={missions.length}
                currentMissionIndex={currentMissionIndex}
                campaignXp={campaignXp}
                totalXp={profile?.totalPoints ?? 0}
                streak={profile?.streak ?? 0}
                decayingMissionIds={decayingMissionIds}
                hasNoCampaign={hasNoCampaign}
                campaignColor={campaignColor}
                enrolled={enrolledState?.enrolled ?? false}
                onEnroll={handleEnroll}
              />
            )}
          </div>
        </div>
      </div>

      {/* Hover tooltip — small badge near cursor while actively hovering a planet */}
      {activeHover && (
        <MissionTooltip
          mission={activeHover}
          missionIndex={missions.findIndex((m) => m.id === activeHover.id)}
          totalMissions={missions.length}
          status={effectiveStatuses[activeHover.id] ?? "locked"}
          mousePos={mousePos}
          campaignColor={campaignColor}
        />
      )}
    </div>
  );
}

// ── Inline tooltip component ──

function MissionTooltip({
  mission,
  missionIndex,
  totalMissions,
  status,
  mousePos,
  campaignColor,
}: {
  mission: Mission;
  missionIndex: number;
  totalMissions: number;
  status: MissionStatus;
  mousePos: { x: number; y: number };
  campaignColor: string;
}) {
  const statusLabel: Record<MissionStatus, string> = {
    locked: "Locked",
    available: "Available",
    "in-progress": "In Progress",
    accomplished: "Accomplished",
    decaying: "Needs Review",
  };

  const statusColor: Record<MissionStatus, string> = {
    locked: "#6a7288",
    available: "#06d6d6",
    "in-progress": "#06d6d6",
    accomplished: "#22c55e",
    decaying: "#f59e0b",
  };

  return (
    <div
      className="fixed z-[70] pointer-events-none"
      style={{ left: mousePos.x + 16, top: mousePos.y - 8 }}
    >
      <div
        className="glass-panel px-3 py-2.5 min-w-[180px] rounded-lg"
        style={{
          borderColor: `${campaignColor}30`,
          boxShadow: `0 0 20px ${campaignColor}15, inset 0 0 15px ${campaignColor}05`,
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-3 right-3 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${campaignColor}60, transparent)` }}
        />
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] telemetry-font tracking-wider uppercase"
            style={{ color: statusColor[status] }}
          >
            {statusLabel[status]}
          </span>
          <span className="text-[10px] telemetry-font text-[#6a7288]">
            Mission {missionIndex + 1}
          </span>
        </div>
        <div
          className="display-font text-[11px] tracking-wider uppercase mb-1"
          style={{ color: campaignColor }}
        >
          {mission.title}
        </div>
        <div className="flex items-center gap-2 text-[11px] telemetry-font text-[#8eafc8]">
          <span>{mission.estimatedMinutes} min</span>
          <span className="text-[#444b5c]">|</span>
          <span>{mission.defaultLoadout.length} steps</span>
        </div>
      </div>
    </div>
  );
}
