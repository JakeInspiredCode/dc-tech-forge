"use client";

import type { Mission, MissionStep } from "@/lib/types/campaign";
import { STEP_TYPE_ICONS } from "@/lib/constants/mission";
import HexPanel from "@/components/ui/hex-panel";
import StatusBadge from "@/components/ui/status-badge";
import ActionButton from "@/components/ui/action-button";

interface MissionBriefingProps {
  mission: Mission;
  campaignTitle?: string;
  loadout: MissionStep[];
  onDeploy: () => void;
  onCustomize: () => void;
  onSkipToCheck: () => void;
}

export default function MissionBriefing({
  mission,
  campaignTitle,
  loadout,
  onDeploy,
  onCustomize,
  onSkipToCheck,
}: MissionBriefingProps) {
  const totalMinutes = loadout.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <HexPanel>
        <div className="space-y-2">
          {campaignTitle && (
            <p className="text-xs text-v2-text-muted uppercase tracking-wider">
              {campaignTitle}
            </p>
          )}
          <h1 className="display-font text-xl text-v2-cyan">{mission.title}</h1>
          <p className="text-sm text-v2-text-dim">{mission.description}</p>
          <div className="flex items-center gap-2 pt-1">
            <StatusBadge label={`~${mission.estimatedMinutes} min`} variant="muted" />
            <StatusBadge label={`${loadout.length} steps`} variant="muted" />
          </div>
        </div>
      </HexPanel>

      {/* Loadout */}
      <HexPanel>
        <h2 className="text-xs text-v2-text-muted uppercase tracking-wider mb-3">
          Mission Loadout
        </h2>
        <div className="space-y-2">
          {loadout.map((step, i) => (
            <div
              key={step.id}
              className="flex items-center gap-3 p-2 rounded bg-v2-bg-elevated/50"
            >
              <span className="text-sm w-5 text-center">{STEP_TYPE_ICONS[step.type] ?? "•"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-v2-text truncate">{step.label}</div>
                <div className="text-xs text-v2-text-muted">
                  ~{step.estimatedMinutes} min
                  {step.required && " · Required"}
                </div>
              </div>
              <span className="text-xs text-v2-text-muted mono">{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-v2-border">
          <span className="text-xs text-v2-text-dim">
            Total: ~{totalMinutes} min
          </span>
          <button
            onClick={onCustomize}
            className="text-xs text-v2-cyan hover:text-v2-cyan-bright transition-colors"
          >
            Customize loadout →
          </button>
        </div>
      </HexPanel>

      {/* Knowledge Check Preview */}
      <HexPanel>
        <h2 className="text-xs text-v2-text-muted uppercase tracking-wider mb-2">
          Knowledge Check
        </h2>
        <p className="text-sm text-v2-text">
          {mission.knowledgeCheck.description}
        </p>
        <p className="text-xs text-v2-text-dim mt-1">
          Pass threshold: {Math.round(mission.knowledgeCheck.passThreshold * 100)}%
        </p>
      </HexPanel>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <ActionButton variant="primary" size="lg" onClick={onDeploy} className="flex-1">
          Deploy Mission
        </ActionButton>
        <ActionButton variant="ghost" size="md" onClick={onSkipToCheck}>
          Skip to Knowledge Check
        </ActionButton>
      </div>
    </div>
  );
}
