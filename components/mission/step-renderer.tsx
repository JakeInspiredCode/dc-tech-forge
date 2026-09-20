"use client";

import { useMemo } from "react";
import { useQuery } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import type { MissionStep } from "@/lib/types/campaign";
import { mapConvexCard } from "@/lib/types";
import { getAllModules } from "@/lib/seeds/quick-draw-modules";
import { getScenarioById } from "@/lib/seeds/diagnosis-scenarios";
import { SCENARIOS } from "@/lib/scenarios";
import ActionButton from "@/components/ui/action-button";
import HexPanel from "@/components/ui/hex-panel";

// Lazy imports for heavy components
import dynamic from "next/dynamic";
const CardQueue = dynamic(() => import("@/components/card-queue"), { ssr: false });
const QuickDrawGame = dynamic(() => import("@/components/forge/quick-draw/quick-draw-game"), { ssr: false });
const DiagnosisGame = dynamic(() => import("@/components/forge/diagnosis/diagnosis-game"), { ssr: false });
const DrillWalkthrough = dynamic(() => import("@/components/drill-walkthrough"), { ssr: false });
const LinuxFoundations = dynamic(() => import("@/components/linux-foundations"), { ssr: false });
const ChapterRenderer = dynamic(() => import("@/components/chapter/chapter-renderer"), { ssr: false });
const BootLearn = dynamic(() => import("@/components/forge/boot-process/boot-learn"), { ssr: false });
const BootTriage = dynamic(() => import("@/components/forge/boot-process/boot-triage"), { ssr: false });
const FilesystemGame = dynamic(() => import("@/components/forge/explorer/filesystem-game"), { ssr: false });

import GuidedTerminal, { getGuidedTaskSet } from "@/components/mission/guided-terminal";

interface StepRendererProps {
  step: MissionStep;
  /** The activity was actually finished: credit the step and move on. */
  onStepComplete: () => void;
  /** The learner backed out or quit: move on without credit. */
  onStepLeave: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Card Set Step ──
function CardSetStep({ step, onStepComplete }: StepRendererProps) {
  const params = step.contentRef.params as {
    topicId?: string; tier?: number; count?: number; cardIds?: string[];
  } | undefined;
  const cardIds = params?.cardIds;
  const topicId = params?.topicId ?? "linux";
  const tier = params?.tier ?? 1;
  const count = params?.count ?? 8;

  // If specific cardIds are provided, fetch all cards and filter.
  // Otherwise fall back to topic+tier random selection.
  // Both queries always run (hooks can't be conditional) but only the
  // relevant result is used.
  const rawCards = useQuery<Array<{ cardId: string; [k: string]: unknown }>>(api.forgeCards.getByTopicTier, { topicId, tier });
  const allCards = useQuery<Array<{ cardId: string; [k: string]: unknown }>>(api.forgeCards.getAll);

  const cards = useMemo(() => {
    if (cardIds && allCards) {
      const idSet = new Set(cardIds);
      const matched = allCards.filter((c) => idSet.has(c.cardId)).map(mapConvexCard);
      return shuffle(matched);
    }
    if (!rawCards || rawCards.length === 0) return [];
    return shuffle(rawCards).slice(0, count).map(mapConvexCard);
  }, [cardIds, allCards, rawCards, count]);

  if (cardIds ? !allCards : !rawCards) {
    return <LoadingStep />;
  }

  if (cards.length === 0) {
    return <FallbackStep label="No cards found for this selection" onComplete={onStepComplete} />;
  }

  return <CardQueue cards={cards} sessionType="topic-drill" onComplete={onStepComplete} />;
}

// ── Quick Draw Step ──
function QuickDrawStep({ step, onStepComplete, onStepLeave }: StepRendererProps) {
  const moduleId = step.contentRef.id;
  const params = step.contentRef.params as {
    categories?: string[];
    count?: number;
  } | undefined;

  const modules = getAllModules();
  const mod = modules.find((m) => m.id === moduleId);

  const items = useMemo(() => {
    if (!mod) return [];
    let filtered = mod.items;
    // Filter by categories if specified (e.g. ["file-ops", "text-processing"])
    if (params?.categories && params.categories.length > 0) {
      const cats = new Set(params.categories);
      filtered = filtered.filter((item) => item.category && cats.has(item.category));
    }
    // Shuffle and limit
    const shuffled = shuffle(filtered);
    if (params?.count && params.count < shuffled.length) {
      return shuffled.slice(0, params.count);
    }
    return shuffled;
  }, [mod, params]);

  if (!mod) {
    return <FallbackStep label={`Quick Draw module "${moduleId}" not found`} onComplete={onStepComplete} />;
  }

  if (items.length === 0) {
    return <FallbackStep label="No items found for this Quick Draw selection" onComplete={onStepComplete} />;
  }

  return (
    <QuickDrawGame
      items={items}
      mode="type"
      onComplete={() => onStepComplete()}
      onQuit={() => onStepLeave()}
    />
  );
}

// ── Diagnosis Step ──
function DiagnosisStep({ step, onStepComplete, onStepLeave }: StepRendererProps) {
  const scenarioId = step.contentRef.id;
  const scenario = getScenarioById(scenarioId);

  if (!scenario) {
    return <FallbackStep label={`Diagnosis scenario "${scenarioId}" not found`} onComplete={onStepComplete} />;
  }

  return (
    <DiagnosisGame
      scenario={scenario}
      onComplete={() => onStepComplete()}
      onQuit={() => onStepLeave()}
    />
  );
}

// ── Drill Step ──
function DrillStep({ step, onStepComplete }: StepRendererProps) {
  const scenarioId = step.contentRef.id;
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);

  if (!scenario) {
    return <FallbackStep label={`Drill scenario "${scenarioId}" not found`} onComplete={onStepComplete} />;
  }

  return <DrillWalkthrough scenario={scenario} onComplete={onStepComplete} />;
}

// ── Reading Step (Foundations) ──
function ReadingStep({ step, onStepComplete }: StepRendererProps) {
  const sectionId = Number(step.contentRef.id);

  return (
    <LinuxFoundations
      initialSection={sectionId}
      missionMode
      onMissionComplete={onStepComplete}
    />
  );
}

// ── Chapter Section Step (data-driven chapters) ──
function ChapterSectionStep({ step, onStepComplete }: StepRendererProps) {
  return (
    <ChapterRenderer
      sectionId={step.contentRef.id}
      missionMode
      onMissionComplete={onStepComplete}
    />
  );
}

// ── Boot Process Step ──
// Open-ended: there is no finish line, so the tool's own Back button can't
// stand in for completion. The mission header offers "Done" instead.
function BootStep({ step, onStepLeave }: StepRendererProps) {
  if (step.contentRef.id === "triage") {
    return <BootTriage onBack={onStepLeave} />;
  }
  return <BootLearn onBack={onStepLeave} />;
}

// ── Terminal Step (guided practice in mission context) ──
function TerminalStep({ step, onStepComplete }: StepRendererProps) {
  const taskSet = getGuidedTaskSet(step.contentRef.id);
  return (
    <GuidedTerminal
      tasks={taskSet.tasks}
      title={taskSet.title}
      intro={taskSet.intro}
      onComplete={onStepComplete}
    />
  );
}

// ── Explorer Step ──
function ExplorerStep({ step, onStepComplete, onStepLeave }: StepRendererProps) {
  const mode = (step.contentRef.id === "label" ? "label" : "learn") as "learn" | "label";
  return (
    <FilesystemGame
      mode={mode}
      onBack={onStepLeave}
      onComplete={onStepComplete}
      maxQuestions={10}
      difficulty="easy"
    />
  );
}

// ── Helpers ──

function LoadingStep() {
  return (
    <HexPanel>
      <div className="py-8 text-center text-v2-text-dim text-sm">Loading activity...</div>
    </HexPanel>
  );
}

function FallbackStep({ label, onComplete }: { label: string; onComplete: () => void }) {
  return (
    <HexPanel>
      <div className="py-8 text-center">
        <p className="text-v2-text-muted text-sm mb-4">{label}</p>
        <ActionButton variant="secondary" onClick={onComplete}>
          Continue
        </ActionButton>
      </div>
    </HexPanel>
  );
}

// ── Main Renderer ──

export default function StepRenderer(props: StepRendererProps) {
  const { step, onStepComplete } = props;
  switch (step.contentRef.kind) {
    case "foundation-section":
      return <ReadingStep {...props} />;
    case "chapter-section":
      return <ChapterSectionStep {...props} />;
    case "card-set":
      return <CardSetStep {...props} />;
    case "quick-draw-module":
      return <QuickDrawStep {...props} />;
    case "diagnosis-scenario":
      return <DiagnosisStep {...props} />;
    case "drill-scenario":
      return <DrillStep {...props} />;
    case "boot-process":
      return <BootStep {...props} />;
    case "terminal-exercise":
      return <TerminalStep {...props} />;
    case "explorer":
      return <ExplorerStep {...props} />;
    default:
      return <FallbackStep label={`Unknown activity: ${step.contentRef.kind}`} onComplete={onStepComplete} />;
  }
}
