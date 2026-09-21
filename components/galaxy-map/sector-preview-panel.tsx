"use client";

import type { Sector, SectorProgress, MissionStatus } from "@/lib/types/campaign";
import { getCampaign, getMissionsForCampaign } from "@/lib/seeds/campaigns";
import { V2 } from "@/lib/design/forge-v2-tokens";

interface SectorPreviewPanelProps {
  sector: Sector;
  progress: SectorProgress;
  missionStatuses: Record<string, MissionStatus>;
}

function getMissionStatusIcon(status: MissionStatus | undefined): string {
  switch (status) {
    case "accomplished":
      return "✓";
    case "in-progress":
      return "▸";
    case "decaying":
      return "⟲";
    case "available":
      return "○";
    default:
      return "·";
  }
}

function getMissionStatusColor(
  status: MissionStatus | undefined,
  sectorColor: string,
): string {
  switch (status) {
    case "accomplished":
      return "#22c55e";
    case "in-progress":
      return sectorColor;
    case "decaying":
      return "#f59e0b";
    case "available":
      return V2.text.dim;
    default:
      return V2.text.muted;
  }
}

export default function SectorPreviewPanel({
  sector,
  progress,
  missionStatuses,
}: SectorPreviewPanelProps) {
  const campaign = getCampaign(sector.campaignIds[0]);
  const missions = campaign ? getMissionsForCampaign(campaign.id) : [];
  const pct =
    progress.totalMissions > 0
      ? Math.round((progress.completedMissions / progress.totalMissions) * 100)
      : 0;

  return (
    <div
      className="h-full p-3 flex flex-col animate-[holoMaterialize_0.18s_ease-out]"
      style={{ borderColor: `${sector.color}30` }}
    >
      {/* Sector header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{sector.icon}</span>
        <div className="min-w-0 flex-1">
          <h2
            className="display-font text-sm tracking-[0.15em] uppercase truncate"
            style={{
              color: sector.color,
              textShadow: `0 0 12px ${sector.color}40`,
            }}
          >
            {sector.title}
          </h2>
          <span className="text-[10px] telemetry-font text-[#8eafc8] uppercase tracking-wider">
            Sector
          </span>
        </div>
      </div>

      <p className="text-[11px] text-[#c8d6e5] leading-snug mb-3">
        {sector.description}
      </p>

      {campaign && (
        <>
          {/* The campaign shares the sector's name (shown above), so repeating
              it here would say the same thing twice. Show its codename, if it
              has one, as flavour. */}
          {campaign.codename && (
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-1 h-3.5 rounded-full"
                style={{ backgroundColor: sector.color }}
              />
              <span className="display-font text-[11px] tracking-wider uppercase text-[#e0e4ec] truncate">
                {campaign.codename}
              </span>
            </div>
          )}

          {/* Campaign meta + progress */}
          <div className="flex items-center gap-3 mb-1.5 text-[10px] telemetry-font text-[#8eafc8]">
            <span>{missions.length} missions</span>
            <span>~{campaign.estimatedMinutes}m</span>
            <span>~{campaign.estimatedDays}d</span>
          </div>

          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 h-1 rounded-full bg-v2-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: progress.isComplete ? "#22c55e" : sector.color,
                }}
              />
            </div>
            <span
              className="text-[10px] telemetry-font"
              style={{ color: sector.color }}
            >
              {pct}%
            </span>
          </div>

          {/* Mission list — compact rows, fits without scroll on desktop */}
          <div className="space-y-px flex-1 min-h-0">
            {missions.map((mission, i) => {
              const status = missionStatuses[mission.id];
              return (
                <div
                  key={mission.id}
                  className="flex items-center gap-1.5 py-0.5 px-1 rounded text-[11px]"
                  style={{
                    backgroundColor:
                      status === "in-progress"
                        ? `${sector.color}14`
                        : "transparent",
                  }}
                >
                  <span
                    className="text-[10px] w-3 text-center"
                    style={{
                      color: getMissionStatusColor(status, sector.color),
                    }}
                  >
                    {getMissionStatusIcon(status)}
                  </span>
                  <span className="text-[#8eafc8] telemetry-font text-[10px] w-4 text-right opacity-70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="flex-1 truncate text-[11px]"
                    style={{
                      color:
                        status === "accomplished"
                          ? "#22c55e"
                          : status === "in-progress"
                            ? sector.color
                            : "#c8d6e5",
                    }}
                  >
                    {mission.title}
                  </span>
                  <span className="text-[10px] telemetry-font text-[#8eafc8] opacity-70">
                    {mission.estimatedMinutes}m
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div
            className="pt-2 mt-2 border-t text-center"
            style={{ borderColor: `${sector.color}20` }}
          >
            <div className="text-[10px] telemetry-font uppercase tracking-wider opacity-90"
              style={{ color: sector.color }}
            >
              {progress.isComplete ? "Sector Secured ✓" : "Select the star to open this campaign →"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
