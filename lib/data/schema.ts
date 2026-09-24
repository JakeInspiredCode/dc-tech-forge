// Document types stored in the in-memory store.
// Shape mirrors what the Convex React client used to return, so call sites that
// destructure _id / _creationTime keep working without changes.

import type { ForgeProfile, TopicProgress, ForgeReview, ForgeSession } from "../types";
import type { MissionStep } from "../types/campaign";

export type Doc<T> = T & { _id: string; _creationTime: number };

export interface CardFields {
  cardId: string;
  topicId: string;
  type: string;
  front: string;
  back: string;
  difficulty: number;
  tier: number;
  steps?: string[];
  sortOrder?: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: string;
  lastReview?: string;
}

export interface ReviewFields {
  cardId: string;
  timestamp: string;
  quality: number;
  responseTime: number;
}

export interface SessionFields {
  type: string;
  startTime: string;
  endTime?: string;
  cardIds: string[];
  answers: Array<{
    cardId: string;
    transcript: string;
    rubricScores: { technical: number; structure: number; ownership: number };
    missedTerms: string[];
  }>;
  overallScore?: number;
}

export interface ProgressFields {
  topicId: string;
  masteryPercent: number;
  currentTier: number;
  tierProgress: {
    tier1: { total: number; qualified: number };
    tier2: { total: number; qualified: number };
    tier3: { total: number; qualified: number };
    tier4: { total: number; qualified: number };
  };
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  weakFlag: boolean;
  lastUpdated: string;
}

export interface ProfileFields {
  profileId: string;
  streak: number;
  lastSessionDate: string;
  totalPoints: number;
  badges: string[];
  totalSessionMinutes: number;
}

export interface StoryFields {
  storyId: string;
  question: string;
  framework: string;
  answer: string;
  chunks?: Array<{ label: string; summary: string; content: string }>;
}

export interface SpeedRunFields {
  timestamp: string;
  topicId: string;
  cardTypeFilter: string[];
  startingTime: number;
  totalCards: number;
  correctCards: number;
  partialCards: number;
  wrongCards: number;
  totalPoints: number;
  bestStreak: number;
  avgResponseMs: number;
  cardResults: Array<{
    cardId: string;
    result: string;
    userInput: string;
    responseMs: number;
    feedback: string;
  }>;
}

export interface DrillFields {
  scenarioId: string;
  timestamp: string;
  totalSteps: number;
  completedSteps: number;
  steps: Array<{
    stepIndex: number;
    userResponse: string;
    matchedTerms: string[];
    totalTerms: number;
    usedHints: boolean;
  }>;
  overallTermHitRate: number;
}

export interface CampaignProgressFields {
  campaignId: string;
  enrolled: boolean;
  enrolledAt: string;
  currentMissionIndex: number;
  completedMissions: string[];
  lastActivityAt: string;
}

export interface MissionProgressFields {
  missionId: string;
  status: string;
  customLoadout?: MissionStep[];
  stepsCompleted: string[];
  knowledgeCheckPassed: boolean;
  knowledgeCheckScore?: number;
  bestScore?: number;
  accomplishedAt?: string;
  lastReviewedAt?: string;
  xpEarned: number;
}

export interface BountyHistoryFields {
  bountyId: string;
  completedAt: string;
  score: number;
  xpEarned: number;
}

export interface DiagnosisHistoryFields {
  scenarioId: string;
  completedAt: string;
  difficulty: string;
  score: number;
  stepsCompleted: number;
  totalSteps: number;
  xpEarned: number;
}

export interface QuickDrawHistoryFields {
  moduleId: string;
  completedAt: string;
  score: number;
  totalItems: number;
  correctItems: number;
  timeMs: number;
  xpEarned: number;
}

export interface TicketHistoryFields {
  ticketId: string;
  completedAt: string;
  difficulty: string;
  score: number;
  commandsUsed: string[];
  answer: string;
  usedHint: boolean;
  xpEarned: number;
  timeMs: number;
}

// One row per meaningful thing done — a mission accomplished, a badge earned,
// a ticket resolved — written by the mutation that did it. Only content ids
// and numbers, never free text: the Fleet Log turns ids into names, and rows
// like these are what other people will see once accounts exist.
export type ActivityKind =
  | "mission_accomplished"
  | "campaign_completed"
  | "badge_earned"
  | "speed_run"
  | "session_completed"
  | "drill_completed"
  | "diagnosis_solved"
  | "quick_draw"
  | "ticket_resolved"
  | "bounty_completed";

export interface ActivityFields {
  kind: ActivityKind;
  /** What it was about: a mission, campaign, badge, topic, scenario, module, bounty id, or ticket level. */
  ref: string;
  /** Per kind: a percentage for checks, drills and tickets; points for a speed run; cards for a session. */
  value?: number;
  /** ISO timestamp. */
  at: string;
}

export interface State {
  forgeCards: Doc<CardFields>[];
  forgeReviews: Doc<ReviewFields>[];
  forgeSessions: Doc<SessionFields>[];
  forgeProgress: Doc<ProgressFields>[];
  forgeProfile: Doc<ProfileFields>[];
  forgeStories: Doc<StoryFields>[];
  forgeSpeedRuns: Doc<SpeedRunFields>[];
  forgeDrills: Doc<DrillFields>[];
  forgeCampaignProgress: Doc<CampaignProgressFields>[];
  forgeMissionProgress: Doc<MissionProgressFields>[];
  forgeBountyHistory: Doc<BountyHistoryFields>[];
  forgeDiagnosisHistory: Doc<DiagnosisHistoryFields>[];
  forgeQuickDrawHistory: Doc<QuickDrawHistoryFields>[];
  forgeTicketHistory: Doc<TicketHistoryFields>[];
  forgeActivity: Doc<ActivityFields>[];
}

export const ENTITY_KEYS: (keyof State)[] = [
  "forgeCards",
  "forgeReviews",
  "forgeSessions",
  "forgeProgress",
  "forgeProfile",
  "forgeStories",
  "forgeSpeedRuns",
  "forgeDrills",
  "forgeCampaignProgress",
  "forgeMissionProgress",
  "forgeBountyHistory",
  "forgeDiagnosisHistory",
  "forgeQuickDrawHistory",
  "forgeTicketHistory",
  "forgeActivity",
];

export type { ForgeProfile, TopicProgress, ForgeReview, ForgeSession };
