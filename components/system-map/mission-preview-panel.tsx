"use client";

import type {
  Mission,
  MissionStatus,
  MissionStep,
} from "@/lib/types/campaign";
import { STEP_TYPE_ICONS } from "@/lib/constants/mission";
import ActionButton from "@/components/ui/action-button";
import StatusBadge from "@/components/ui/status-badge";

interface MissionPreviewPanelProps {
  mission: Mission;
  status: MissionStatus;
  missionNumber: number;
  totalMissions: number;
  campaignColor: string;
  onDeploy: (missionId: string, loadout: MissionStep[]) => void;
  onSkipToCheck: (missionId: string) => void;
}

export default function MissionPreviewPanel({
  mission,
  status,
  missionNumber,
  totalMissions,
  campaignColor,
  onDeploy,
  onSkipToCheck,
}: MissionPreviewPanelProps) {
  const totalMinutes = mission.defaultLoadout.reduce(
    (sum, s) => sum + s.estimatedMinutes,
    0,
  );

  const isAccomplished = status === "accomplished";

  const handleDeploy = () => onDeploy(mission.id, mission.defaultLoadout);
  const handleSkip = () => onSkipToCheck(mission.id);

  return (
    <div
      className="h-full p-3 flex flex-col animate-[holoMaterialize_0.18s_ease-out]"
      style={{ borderColor: `${campaignColor}30` }}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div
          className="shrink-0 w-7 h-7 rounded flex items-center justify-center telemetry-font text-xs font-bold mt-0.5"
          style={{
            background: `${campaignColor}12`,
            border: `1px solid ${campaignColor}30`,
            color: campaignColor,
            textShadow: `0 0 8px ${campaignColor}40`,
          }}
        >
          {missionNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] telemetry-font text-[#8eafc8] uppercase tracking-wider">
              Mission {missionNumber} of {totalMissions}
            </span>
            {status === "decaying" && (
              <StatusBadge label="Needs review" variant="warning" />
            )}
            {isAccomplished && (
              <StatusBadge label="Accomplished" variant="cyan" />
            )}
          </div>
          <h2
            className="display-font text-sm tracking-[0.12em] uppercase mt-0.5"
            style={{
              color: campaignColor,
              textShadow: `0 0 12px ${campaignColor}40`,
            }}
          >
            {mission.title}
          </h2>
        </div>
      </div>

      {/* PRIMARY ACTION — Deploy CTA at top */}
      <div className="mb-3">
        <ActionButton
          onClick={handleDeploy}
          variant={isAccomplished ? "secondary" : "primary"}
          size="lg"
          className="w-full"
        >
          {isAccomplished ? "Review Mission" : "▶ Deploy Mission"}
        </ActionButton>
      </div>

      {/* Description */}
      <p className="text-[11px] text-[#c8d6e5] leading-snug mb-3">
        {mission.description}
      </p>

      {/* Loadout — read-only */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[10px] telemetry-font text-[#8eafc8] uppercase tracking-wider">
            Loadout
          </h3>
          <span className="text-[10px] telemetry-font text-[#8eafc8]">
            {mission.defaultLoadout.length} steps · ~{totalMinutes}m
          </span>
        </div>
        <div className="space-y-px">
          {mission.defaultLoadout.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-2 py-0.5 px-1 text-[11px]"
            >
              <span className="w-4 text-center text-[10px]">
                {STEP_TYPE_ICONS[step.type] ?? "•"}
              </span>
              <span className="text-[#c8d6e5] truncate flex-1">
                {step.label}
              </span>
              <span className="telemetry-font text-[10px] text-[#8eafc8]">
                {step.estimatedMinutes}m
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Knowledge Check */}
      <div
        className="px-2.5 py-2.5 rounded"
        style={{
          background: `${campaignColor}08`,
          border: `1px solid ${campaignColor}12`,
        }}
      >
        <h3 className="text-[10px] telemetry-font text-[#8eafc8] uppercase tracking-wider mb-1">
          Knowledge Check
        </h3>
        <p className="text-[11px] text-[#c8d6e5] leading-snug">
          {mission.knowledgeCheck.description}
        </p>
        <span className="text-[9px] telemetry-font text-[#8eafc8]">
          Pass: {Math.round(mission.knowledgeCheck.passThreshold * 100)}%
        </span>

        {/* Final Boss shortcut — skip the loadout, go straight to the assessment.
            Red styling makes it clear this is the challenge path. */}
        {!isAccomplished && (
          <button
            onClick={handleSkip}
            className="w-full mt-2.5 px-2 py-1.5 rounded text-[11px] display-font tracking-[0.14em] uppercase font-bold transition-all"
            style={{
              background:
                "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)",
              border: "1px solid #ef4444",
              color: "#fff5f5",
              textShadow: "0 0 6px rgba(220, 38, 38, 0.6)",
              boxShadow:
                "0 0 12px rgba(220, 38, 38, 0.35), inset 0 0 8px rgba(254, 202, 202, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)";
              e.currentTarget.style.boxShadow =
                "0 0 18px rgba(239, 68, 68, 0.55), inset 0 0 8px rgba(254, 202, 202, 0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)";
              e.currentTarget.style.boxShadow =
                "0 0 12px rgba(220, 38, 38, 0.35), inset 0 0 8px rgba(254, 202, 202, 0.1)";
            }}
          >
            ▶▶ Jump to Mission Final Boss
          </button>
        )}
      </div>
    </div>
  );
}
