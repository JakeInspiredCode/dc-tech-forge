"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Hint from "@/components/ui/hint";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import type { Doc, MissionProgressFields } from "@/lib/data/schema";
import type { Mission, MissionStep } from "@/lib/types/campaign";
import { XP, XP_MULTIPLIERS } from "@/lib/types/campaign";
import { STEP_TYPE_LABELS } from "@/lib/constants/mission";
import { campaignHref, isOpenEnded, nextMissionId, resumePoint } from "@/lib/mission/flow";
import { getCampaign, getMissionsForCampaign } from "@/lib/seeds/campaigns";
import { SESSION_KEYS } from "@/lib/storage-keys";
import MissionBriefing from "./mission-briefing";
import LoadoutEditor from "./loadout-editor";
import KnowledgeCheckScreen from "./knowledge-check";
import MCKnowledgeCheck from "./mc-knowledge-check";
import MissionDebrief from "./mission-debrief";
import StepRenderer from "./step-renderer";
import { getMCQuestions } from "@/lib/seeds/knowledge-checks";
import TelemetryBar from "@/components/ui/telemetry-bar";
import ActionButton from "@/components/ui/action-button";

type Phase = "briefing" | "playing" | "knowledge-check" | "debrief";

// Title, position, and a way out. Shown on every working screen of a mission,
// which previously had none of the three.
function MissionHeader({
  mission,
  campaignId,
  campaignTitle,
  position,
}: {
  mission: Mission;
  campaignId?: string;
  campaignTitle?: string;
  position: string;
}) {
  return (
    <header className="flex items-end justify-between gap-4 pb-3 border-b border-v2-border">
      <div className="min-w-0">
        {campaignTitle && (
          <p className="text-[11px] tracking-widest uppercase text-v2-amber-bright">{campaignTitle}</p>
        )}
        <h1 className="display-font text-base text-v2-text truncate">{mission.title}</h1>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="telemetry-font text-xs text-v2-text">{position}</span>
        <Link
          href={campaignId ? campaignHref(campaignId) : "/"}
          className="inline-flex items-center max-md:min-h-[44px] text-xs text-v2-cyan hover:text-v2-cyan-bright underline underline-offset-4 decoration-dotted hover:decoration-solid"
        >
          Exit to campaign
        </Link>
      </div>
    </header>
  );
}

/** Resolve custom loadout from sessionStorage (set by system-map overlay) */
function resolveLoadout(mission: Mission): MissionStep[] {
  if (typeof window === "undefined") return mission.defaultLoadout;
  const stored = sessionStorage.getItem(SESSION_KEYS.loadout(mission.id));
  if (!stored) return mission.defaultLoadout;
  try {
    const stepIds: string[] = JSON.parse(stored);
    sessionStorage.removeItem(SESSION_KEYS.loadout(mission.id));
    const filtered = mission.defaultLoadout.filter((s) => stepIds.includes(s.id));
    return filtered.length > 0 ? filtered : mission.defaultLoadout;
  } catch {
    return mission.defaultLoadout;
  }
}

interface MissionPlayerProps {
  mission: Mission;
}

export default function MissionPlayer({ mission }: MissionPlayerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const completeMissionStep = useMutation(api.forgeMissions.completeMissionStep);
  const submitKnowledgeCheck = useMutation(api.forgeMissions.submitKnowledgeCheck);
  const updateMissionStatus = useMutation(api.forgeMissions.updateMissionStatus);
  const initMissionState = useMutation(api.forgeMissions.initMissionState);
  const advanceMission = useMutation(api.forgeCampaigns.advanceMission);
  const addPoints = useMutation(api.forgeProfile.addPoints);
  // undefined until the data layer has hydrated; then the saved row, or null.
  const saved = useQuery<Doc<MissionProgressFields> | null>(api.forgeMissions.getMissionState, {
    missionId: mission.id,
  });

  // Determine initial phase from query params (system-map passes autostart/skipToCheck)
  const autostart = searchParams.get("autostart") === "true";
  const skipToCheck = searchParams.get("skipToCheck") === "true";

  const [phase, setPhase] = useState<Phase>(
    skipToCheck ? "knowledge-check" : autostart ? "playing" : "briefing",
  );
  const [loadout, setLoadout] = useState<MissionStep[]>(() => resolveLoadout(mission));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepsCompleted, setStepsCompleted] = useState<string[]>([]);
  const [showLoadoutEditor, setShowLoadoutEditor] = useState(false);
  const [debriefData, setDebriefData] = useState<{
    passed: boolean;
    score: number;
    total: number;
    xpEarned: number;
  } | null>(null);

  // Step progress is saved as you go, so pick up where you left off instead of
  // restarting on every refresh. Decided once, from what was saved *before*
  // this visit touched anything.
  const resumeFrom = useCallback(
    (row: Doc<MissionProgressFields> | null) => {
      const point = resumePoint(loadout, row);
      if (point.phase === "knowledge-check") {
        setPhase("knowledge-check");
      } else {
        setCurrentStepIndex(point.stepIndex);
        setStepsCompleted(row?.status === "in-progress" ? row.stepsCompleted : []);
      }
    },
    [loadout],
  );

  // Arriving from the map with autostart or skipToCheck. This waits for the
  // data layer: on a direct load (a refresh) child effects run before the
  // store hydrates, and a write made then is overwritten by hydration.
  const didAutoInit = useRef(false);
  useEffect(() => {
    if (saved === undefined || didAutoInit.current) return;
    didAutoInit.current = true;
    if (autostart) resumeFrom(saved);
    if (autostart || skipToCheck) {
      initMissionState({ missionId: mission.id, status: "in-progress" });
      updateMissionStatus({ missionId: mission.id, status: "in-progress" });
    }
  }, [saved, autostart, skipToCheck, mission.id, initMissionState, updateMissionStatus, resumeFrom]);

  const campaign = getCampaign(mission.campaignId);
  const currentStep = loadout[currentStepIndex];
  const stepProgress = loadout.length > 0 ? (stepsCompleted.length / loadout.length) * 100 : 0;

  const handleDeploy = useCallback(async () => {
    resumeFrom(saved ?? null);
    await initMissionState({ missionId: mission.id, status: "in-progress" });
    await updateMissionStatus({ missionId: mission.id, status: "in-progress" });
    setPhase((p) => (p === "briefing" ? "playing" : p));
  }, [mission.id, saved, resumeFrom, initMissionState, updateMissionStatus]);

  const handleSkipToCheck = useCallback(async () => {
    await initMissionState({ missionId: mission.id, status: "in-progress" });
    await updateMissionStatus({ missionId: mission.id, status: "in-progress" });
    setPhase("knowledge-check");
  }, [mission.id, initMissionState, updateMissionStatus]);

  const handleStepComplete = useCallback(async () => {
    if (!currentStep) return;

    await completeMissionStep({ missionId: mission.id, stepId: currentStep.id });
    if (!stepsCompleted.includes(currentStep.id)) {
      setStepsCompleted([...stepsCompleted, currentStep.id]);
    }

    // Award activity XP
    const activityXp = Math.round(
      XP.ACTIVITY_MIN + Math.random() * (XP.ACTIVITY_MAX - XP.ACTIVITY_MIN)
    );
    await addPoints({ points: activityXp });

    // Advance to next step or knowledge check
    if (currentStepIndex + 1 < loadout.length) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setPhase("knowledge-check");
    }
  }, [currentStep, currentStepIndex, loadout.length, mission.id, stepsCompleted, completeMissionStep, addPoints]);

  // Move on without credit: "Skip", quitting a game, or backing out of a tool.
  const handleLeaveStep = useCallback(() => {
    if (currentStepIndex + 1 < loadout.length) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setPhase("knowledge-check");
    }
  }, [currentStepIndex, loadout.length]);

  const handleKnowledgeCheckComplete = useCallback(
    async (passed: boolean, score: number, total: number) => {
      let missionXp = 0;
      if (passed) {
        missionXp = Math.round(
          XP.MISSION_MIN + (score / total) * (XP.MISSION_MAX - XP.MISSION_MIN)
        );
        // First try bonus
        if (score === total) {
          missionXp = Math.round(missionXp * XP_MULTIPLIERS.PERFECT_SCORE);
        }

        await addPoints({ points: missionXp });

        // Advance campaign
        if (campaign) {
          await advanceMission({
            campaignId: campaign.id,
            completedMissionId: mission.id,
          });
        }
      }

      await submitKnowledgeCheck({
        missionId: mission.id,
        score: score / total,
        passed,
        xpEarned: missionXp,
      });

      setDebriefData({ passed, score, total, xpEarned: missionXp });
      setPhase("debrief");
    },
    [mission.id, campaign, addPoints, advanceMission, submitKnowledgeCheck]
  );

  const nextId = campaign
    ? nextMissionId(getMissionsForCampaign(campaign.id).map((m) => m.id), mission.id)
    : null;

  const handleNextMission = useCallback(() => {
    if (nextId) router.push(`/missions/${nextId}`);
  }, [nextId, router]);

  // Back to where you came from: this campaign's map, not the galaxy.
  const handleReturnToCampaign = useCallback(() => {
    router.push(campaign ? campaignHref(campaign.id) : "/");
  }, [campaign, router]);

  const handleRetry = useCallback(() => {
    setPhase("knowledge-check");
    setDebriefData(null);
  }, []);

  // "Review the material" has to lead somewhere: back to the first step.
  const handleReviewLesson = useCallback(() => {
    setDebriefData(null);
    setCurrentStepIndex(0);
    setPhase("playing");
  }, []);

  // ── Phase rendering ──

  if (phase === "briefing") {
    return (
      <>
        <MissionBriefing
          mission={mission}
          campaignTitle={campaign?.title}
          loadout={loadout}
          onDeploy={handleDeploy}
          onCustomize={() => setShowLoadoutEditor(true)}
          onSkipToCheck={handleSkipToCheck}
        />
        {showLoadoutEditor && (
          <LoadoutEditor
            steps={mission.defaultLoadout}
            onConfirm={(customLoadout) => {
              setLoadout(customLoadout);
              setShowLoadoutEditor(false);
            }}
            onCancel={() => setShowLoadoutEditor(false)}
          />
        )}
      </>
    );
  }

  // Until the data layer is live we don't know where to resume, and showing
  // step 1 for a moment before jumping to step 3 would be worse than waiting.
  if (saved === undefined) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <span className="telemetry-font text-sm text-v2-cyan animate-pulse tracking-wider">Loading mission…</span>
      </div>
    );
  }

  if (phase === "playing") {
    const openEnded = currentStep ? isOpenEnded(currentStep.contentRef.kind) : false;
    return (
      <>
      {/* Outside the space-y column: as a child it would shift the header 16px. */}
      <Hint id="mission" />
      <div className="max-w-2xl mx-auto space-y-4">
        <MissionHeader
          mission={mission}
          campaignId={campaign?.id}
          campaignTitle={campaign?.title}
          position={`Step ${currentStepIndex + 1} of ${loadout.length}`}
        />
        <TelemetryBar value={stepProgress} segments={loadout.length} />

        {/* Current step */}
        {currentStep && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-v2-amber-bright uppercase tracking-wider">
                  {STEP_TYPE_LABELS[currentStep.type] ?? currentStep.type}
                </p>
                <h2 className="text-base text-v2-text font-medium">
                  {currentStep.label}
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ActionButton variant="secondary" size="sm" onClick={handleLeaveStep}>
                  Skip →
                </ActionButton>
                {/* Open-ended tools have no finish line, so you say when you're done. */}
                {openEnded && (
                  <ActionButton variant="primary" size="sm" onClick={handleStepComplete}>
                    Done — continue →
                  </ActionButton>
                )}
              </div>
            </div>

            <StepRenderer
              step={currentStep}
              onStepComplete={handleStepComplete}
              onStepLeave={handleLeaveStep}
            />
          </div>
        )}
      </div>
      </>
    );
  }

  if (phase === "knowledge-check") {
    // Use multiple-choice questions if available for this mission, otherwise fall back to flashcard self-assessment
    const mcQuestions = getMCQuestions(mission.id);
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <MissionHeader
          mission={mission}
          campaignId={campaign?.id}
          campaignTitle={campaign?.title}
          position="Knowledge check"
        />
        {mcQuestions ? (
          <MCKnowledgeCheck
            questions={mcQuestions}
            passThreshold={mission.knowledgeCheck.passThreshold}
            onComplete={handleKnowledgeCheckComplete}
          />
        ) : (
          <KnowledgeCheckScreen check={mission.knowledgeCheck} onComplete={handleKnowledgeCheckComplete} />
        )}
      </div>
    );
  }

  if (phase === "debrief" && debriefData) {
    return (
      <MissionDebrief
        missionTitle={mission.title}
        passed={debriefData.passed}
        score={debriefData.score}
        total={debriefData.total}
        xpEarned={debriefData.xpEarned}
        campaignTitle={campaign?.title}
        campaignComplete={debriefData.passed && campaign !== undefined && nextId === null}
        onNextMission={nextId ? handleNextMission : undefined}
        onReturnToCampaign={handleReturnToCampaign}
        onRetry={handleRetry}
        onReviewLesson={handleReviewLesson}
      />
    );
  }

  return null;
}
