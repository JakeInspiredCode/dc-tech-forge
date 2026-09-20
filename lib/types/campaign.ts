// ═══════════════════════════════════════════════════════════════════════════════
// Campaign / Mission / Bounty Types
// ═══════════════════════════════════════════════════════════════════════════════

import type { TopicId } from "../types";

// ── Campaign ──

export interface Campaign {
  id: string;
  title: string;                // "Linux Operations"
  description: string;
  topicId: TopicId;
  tier: number;                 // which tier(s) this campaign covers
  missions: string[];           // ordered mission IDs
  estimatedDays: number;        // "~2 weeks at 20min/day"
  estimatedMinutes: number;     // total time estimate
  prerequisites?: string[];     // campaign IDs that should be done first
  icon: string;
  color: string;                // accent color for map rendering
}

// ── Mission ──

export interface Mission {
  id: string;
  campaignId: string;
  title: string;                // "Filesystem Hierarchy"
  description: string;          // what you'll learn
  estimatedMinutes: number;
  defaultLoadout: MissionStep[];
  knowledgeCheck: KnowledgeCheck;
  mapPosition: { x: number; y: number };  // star map coordinates
  connections: string[];        // mission IDs this connects to on the map
}

// ── Mission Step (loadout item) ──

export type MissionStepType =
  | "reading"
  | "flashcards"
  | "interactive"
  | "quick-draw"
  | "diagnosis"
  | "terminal"
  | "assessment";

export type ContentRefKind =
  | "foundation-section"
  | "chapter-section"
  | "card-set"
  | "quick-draw-module"
  | "diagnosis-scenario"
  | "explorer"
  | "terminal-exercise"
  | "boot-process"
  | "drill-scenario"
  | "custom";

export interface MissionStep {
  id: string;
  type: MissionStepType;
  label: string;                // "Read: Filesystem Hierarchy"
  description: string;
  estimatedMinutes: number;
  required: boolean;            // false = can be removed from loadout
  contentRef: {
    kind: ContentRefKind;
    id: string;                 // section ID, module ID, scenario ID, etc.
    params?: Record<string, unknown>;
  };
}

// ── Knowledge Check ──

export type KnowledgeCheckType = "card-quiz" | "quick-draw" | "diagnosis" | "mixed";

export interface KnowledgeCheck {
  type: KnowledgeCheckType;
  description: string;          // "Answer 8 of 10 correctly"
  passThreshold: number;        // 0.8 = 80%
  items: KnowledgeCheckItem[];
}

export interface KnowledgeCheckItem {
  type: "flashcard" | "quick-draw" | "multiple-choice";
  contentRef: string;           // card ID, quick-draw item ID, or MC question ID
}

// ── Multiple Choice Questions ──

export interface MCQuestion {
  id: string;
  question: string;
  choices: { label: string; text: string }[];  // A/B/C/D
  correctAnswer: string;                        // "A" | "B" | "C" | "D"
  explanation: string;
}

// ── Bounty ──

export type BountyActivityType =
  | "quick-draw"
  | "incident-drill"
  | "diagnosis"
  | "flashcards"
  | "terminal";

export interface BountyTemplate {
  id: string;
  title: string;                // "Permission Blitz"
  description: string;
  activityType: BountyActivityType;
  topicId: TopicId;
  tier: number;
  estimatedMinutes: number;
  xpReward: number;
  contentRef: {
    kind: ContentRefKind;
    id: string;
    params?: Record<string, unknown>;
  };
}

// ── Player State ──

export type MissionStatus =
  | "locked"
  | "available"
  | "in-progress"
  | "accomplished"
  | "decaying";

export interface PlayerCampaignState {
  campaignId: string;
  enrolled: boolean;
  enrolledAt: string;
  currentMissionIndex: number;
  completedMissions: string[];
  lastActivityAt: string;
}

export interface PlayerMissionState {
  missionId: string;
  status: MissionStatus;
  customLoadout?: MissionStep[];
  stepsCompleted: string[];
  knowledgeCheckPassed: boolean;
  knowledgeCheckScore?: number;
  bestScore?: number;
  accomplishedAt?: string;
  lastReviewedAt?: string;      // for decay calculation
  xpEarned: number;
}

export interface PlayerBountyRecord {
  bountyId: string;
  completedAt: string;
  score: number;
  xpEarned: number;
}

// ── Sector ──

export interface Sector {
  id: string;                     // "sector-linux"
  title: string;                  // "Linux Operations"
  description: string;            // flavor text for hover tooltip
  topicId: TopicId;
  icon: string;                   // emoji
  color: string;                  // accent color
  campaignIds: string[];          // campaigns in this sector
  mapPosition: { x: number; y: number }; // 0-100 percentage coords
  size: "sm" | "md" | "lg";      // visual size on galaxy map
  comingSoon?: boolean;           // show a "COMING SOON" badge; still full-color
  isNew?: boolean;                // show a "NEW CAMPAIGN" badge; freshly released content
}

export interface SectorProgress {
  sectorId: string;
  totalMissions: number;
  completedMissions: number;
  activeCampaignId: string | null;
  hasVolunteered: boolean;
  isComplete: boolean;
}

// ── XP Constants ──

export const XP = {
  FLASHCARD_MIN: 2,
  FLASHCARD_MAX: 5,
  QUICK_DRAW_ROUND_MIN: 10,
  QUICK_DRAW_ROUND_MAX: 30,
  ACTIVITY_MIN: 5,
  ACTIVITY_MAX: 20,
  BOUNTY_MIN: 25,
  BOUNTY_MAX: 75,
  MISSION_MIN: 100,
  MISSION_MAX: 300,
  CAMPAIGN_MILESTONE: 500,      // every 5 missions
  CAMPAIGN_COMPLETION: 2000,
} as const;

// ── XP Multipliers ──

export const XP_MULTIPLIERS = {
  FIRST_TRY: 1.5,
  PERFECT_SCORE: 2.0,
  SPEED_BONUS: 1.25,            // completed under estimated time
} as const;
