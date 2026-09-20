"use client";

import { useEffect, useId, useRef } from "react";
import HexPanel from "@/components/ui/hex-panel";
import GlowStat from "@/components/ui/glow-stat";
import ActionButton from "@/components/ui/action-button";

interface MissionDebriefProps {
  missionTitle: string;
  passed: boolean;
  score: number;
  total: number;
  xpEarned: number;
  campaignTitle?: string;
  /** Passing this mission finished its campaign. */
  campaignComplete?: boolean;
  /** Omit when there is no next mission; the button is then not offered. */
  onNextMission?: () => void;
  onReturnToCampaign: () => void;
  onRetry?: () => void;
  /** Go back through the mission's steps before retaking the check. */
  onReviewLesson?: () => void;
}

export default function MissionDebrief({
  missionTitle,
  passed,
  score,
  total,
  xpEarned,
  campaignTitle,
  campaignComplete = false,
  onNextMission,
  onReturnToCampaign,
  onRetry,
  onReviewLesson,
}: MissionDebriefProps) {
  const titleId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primaryRef.current?.focus();
  }, []);

  const heading = campaignComplete ? "Campaign Complete" : passed ? "Mission Accomplished" : "Mission Incomplete";

  let message: string;
  if (campaignComplete) {
    message = `That was the last mission in ${campaignTitle ?? "this campaign"}. Every mission in it is now done.`;
  } else if (passed) {
    message = "Mission complete. It now counts toward this campaign.";
  } else {
    message = "Not quite. Go back through the material, or retake the check. You keep all the XP you earned along the way.";
  }

  // Exactly one primary action, and it is the first button.
  const primary = passed
    ? onNextMission
      ? { label: "Next Mission →", action: onNextMission }
      : { label: "Back to campaign", action: onReturnToCampaign }
    : onReviewLesson
      ? { label: "Review the material", action: onReviewLesson }
      : onRetry
        ? { label: "Try Again", action: onRetry }
        : { label: "Back to campaign", action: onReturnToCampaign };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 bg-v2-bg-deep/95 z-50 flex items-center justify-center p-4"
    >
      <div className="scan-lines absolute inset-0 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md accomplished-flash">
        <HexPanel glow glowColor={passed ? "cyan" : "warning"} size="lg">
          <div className="text-center py-4">
            <h1
              id={titleId}
              className={`display-font text-2xl tracking-widest mb-1 ${
                passed ? "glow-text-cyan" : "text-v2-warning"
              }`}
            >
              {heading}
            </h1>
            <p className="text-sm text-v2-text mb-6">{missionTitle}</p>

            <div className="flex items-center justify-center gap-8 mb-6">
              <GlowStat value={`${score}/${total}`} label="Score" size="md" />
              <GlowStat value={`${Math.round((score / total) * 100)}%`} label="Accuracy" size="md" />
              {passed && <GlowStat value={`+${xpEarned}`} label="XP" size="md" />}
            </div>

            <p className="text-sm text-v2-text mb-6">{message}</p>

            <div className="flex flex-col gap-2">
              <ActionButton ref={primaryRef} variant="primary" size="lg" onClick={primary.action} className="w-full">
                {primary.label}
              </ActionButton>

              {!passed && onReviewLesson && onRetry && (
                <ActionButton variant="secondary" size="md" onClick={onRetry} className="w-full">
                  Retake the check
                </ActionButton>
              )}
              {passed && onRetry && (
                <ActionButton variant="secondary" size="md" onClick={onRetry} className="w-full">
                  ↻ Practice Again
                </ActionButton>
              )}
              {primary.action !== onReturnToCampaign && (
                <ActionButton variant="secondary" size="md" onClick={onReturnToCampaign} className="w-full">
                  Back to campaign
                </ActionButton>
              )}
            </div>
          </div>
        </HexPanel>
      </div>
    </div>
  );
}
