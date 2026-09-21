"use client";

import { useState } from "react";
import type { MissionStep } from "@/lib/types/campaign";
import { STEP_TYPE_ICONS } from "@/lib/constants/mission";
import HexPanel from "@/components/ui/hex-panel";
import ActionButton from "@/components/ui/action-button";
import { useModalDialog } from "@/lib/use-modal-dialog";

interface LoadoutEditorProps {
  steps: MissionStep[];
  onConfirm: (loadout: MissionStep[]) => void;
  onCancel: () => void;
}

export default function LoadoutEditor({ steps, onConfirm, onCancel }: LoadoutEditorProps) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const step of steps) {
      map[step.id] = true;
    }
    return map;
  });

  const toggle = (stepId: string, required: boolean) => {
    if (required) return; // Can't toggle required steps
    setEnabled((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const dialogRef = useModalDialog(onCancel);
  const activeSteps = steps.filter((s) => enabled[s.id]);
  const totalMinutes = activeSteps.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  const handleConfirm = () => {
    onConfirm(activeSteps);
  };

  return (
    <div className="fixed inset-0 bg-v2-bg-deep/90 z-50 flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loadout-title"
        tabIndex={-1}
        className="w-full max-w-lg"
      >
        <HexPanel size="lg">
          <h2 id="loadout-title" className="display-font text-lg text-v2-cyan tracking-wider mb-4">
            Customize Loadout
          </h2>

          <div className="space-y-2 mb-4">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                aria-pressed={!!enabled[step.id]}
                aria-disabled={step.required || undefined}
                onClick={() => toggle(step.id, step.required)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors text-left ${
                  enabled[step.id]
                    ? "bg-v2-bg-elevated border border-v2-cyan/20"
                    : "bg-v2-bg-surface border border-v2-border opacity-75"
                }`}
              >
                {/* Toggle */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    step.required
                      ? "border-v2-text-muted bg-v2-cyan/20 cursor-not-allowed"
                      : enabled[step.id]
                      ? "border-v2-cyan bg-v2-cyan/20"
                      : "border-v2-border"
                  }`}
                >
                  {(enabled[step.id] || step.required) && (
                    <span className="text-v2-cyan text-xs">✓</span>
                  )}
                </div>

                <span className="text-sm">{STEP_TYPE_ICONS[step.type] ?? "•"}</span>

                <div className="flex-1 min-w-0">
                  <div className="text-sm text-v2-text truncate">{step.label}</div>
                  <div className="text-xs text-v2-text-muted">
                    ~{step.estimatedMinutes} min
                    {step.required && " · Required"}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-v2-border pt-4">
            <span className="text-xs text-v2-text-dim">
              {activeSteps.length} steps · ~{totalMinutes} min
            </span>
            <div className="flex gap-2">
              <ActionButton variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </ActionButton>
              <ActionButton variant="primary" size="sm" onClick={handleConfirm}>
                Confirm Loadout
              </ActionButton>
            </div>
          </div>
        </HexPanel>
      </div>
    </div>
  );
}
