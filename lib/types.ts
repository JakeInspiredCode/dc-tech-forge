// ── Core Types ──

export type TopicId =
  | "linux"
  | "hardware"
  | "fiber"
  | "power-cooling"
  | "networking"
  | "ops-processes"
  | "scale"
  | "behavioral";

export type CardType = "easy" | "intermediate" | "scenario";
export type Difficulty = 1 | 2 | 3;
export type Tier = 1 | 2 | 3 | 4;
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface ForgeCard {
  id: string;
  topicId: TopicId;
  type: CardType;
  front: string;
  back: string;
  difficulty: Difficulty;
  tier: Tier;
  steps?: string[];
  sortOrder?: number;
  // SM-2
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: string;
  lastReview: string | null;
}

export interface ForgeReview {
  cardId: string;
  timestamp: string;
  quality: Quality;
  responseTime: number;
}

export interface ForgeSession {
  id: string;
  type: "mock-interview" | "daily-training" | "topic-drill";
  startTime: string;
  endTime: string | null;
  cardIds: string[];
  answers: SessionAnswer[];
  overallScore: number | null;
}

export interface SessionAnswer {
  cardId: string;
  transcript: string;
  rubricScores: { technical: number; structure: number; ownership: number };
  missedTerms: string[];
}

export interface TopicProgress {
  topicId: TopicId;
  masteryPercent: number;
  currentTier: Tier;
  tierProgress: Record<string, { total: number; qualified: number }>;
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  weakFlag: boolean;
  lastUpdated: string;
}

export interface ForgeProfile {
  streak: number;
  lastSessionDate: string;
  totalPoints: number;
  badges: string[];
  totalSessionMinutes: number;
}

export interface TopicMeta {
  id: TopicId;
  name: string;
  description: string;
  priority: number;
  icon: string;
}

// A topic's name is its sector's name (lib/seeds/sectors.ts) — one name per
// domain, enforced by lib/seeds/vocabulary.test.ts. `linux` spans two sectors
// and takes the primary one's. `behavioral` has no sector.
export const TOPICS: TopicMeta[] = [
  { id: "linux", name: "Linux Operations", description: "CLI, systemd, logs, filesystems, permissions", priority: 1, icon: ">" },
  { id: "hardware", name: "Hardware Systems", description: "GPUs, CPUs, memory, storage, BIOS/UEFI", priority: 2, icon: "#" },
  { id: "networking", name: "Networking", description: "TCP/IP, DNS, switching, routing, load balancing", priority: 3, icon: "~" },
  { id: "fiber", name: "Fiber Optics", description: "Fiber optics, transceivers, cable management", priority: 4, icon: "|" },
  { id: "power-cooling", name: "Power & Cooling", description: "PDUs, UPS, HVAC, thermal management", priority: 5, icon: "^" },
  { id: "ops-processes", name: "Operations", description: "Incident response, change management, monitoring", priority: 6, icon: "!" },
  { id: "scale", name: "Scale & Architecture", description: "Hyperscale vs colo, rack density, cluster hierarchy, monitoring", priority: 7, icon: "*" },
  { id: "behavioral", name: "Behavioral", description: "STAR stories, leadership, teamwork, conflict", priority: 8, icon: "@" },
];

/** The display name for a topic id — never show the raw id ("ops-processes") to a person. */
export function topicName(topicId: string): string {
  return TOPICS.find((t) => t.id === topicId)?.name ?? topicId;
}

// Utility: map a Convex forgeCards doc to a ForgeCard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapConvexCard(c: any): ForgeCard {
  return {
    id: c.cardId,
    topicId: c.topicId as TopicId,
    type: c.type as CardType,
    front: c.front,
    back: c.back,
    difficulty: c.difficulty as Difficulty,
    tier: c.tier as Tier,
    steps: c.steps,
    sortOrder: c.sortOrder ?? undefined,
    easeFactor: c.easeFactor,
    interval: c.interval,
    repetitions: c.repetitions,
    dueDate: c.dueDate,
    lastReview: c.lastReview ?? null,
  };
}

export const BADGE_DEFS = [
  // ── Instant / First-time (easy to earn) ──
  { id: "first-forge", name: "First Forge", condition: "Complete your first session", icon: "anvil" },
  { id: "first-flip", name: "First Flip", condition: "Review your first card", icon: "card" },
  { id: "first-speed", name: "Speed Starter", condition: "Complete a speed run", icon: "zap" },
  { id: "first-correct", name: "Nailed It", condition: "Rate a card 'Easy'", icon: "check" },
  { id: "first-topic", name: "Topic Explorer", condition: "Study a card from any topic", icon: "compass" },

  // ── Volume milestones (low) ──
  { id: "cards-10", name: "Getting Started", condition: "Review 10 cards", icon: "seedling" },
  { id: "cards-25", name: "Quarter Century", condition: "Review 25 cards", icon: "leaf" },
  { id: "cards-50", name: "Half Century", condition: "Review 50 cards", icon: "tree" },
  { id: "cards-100", name: "Centurion", condition: "Review 100 cards", icon: "oak" },
  { id: "cards-250", name: "Card Shark", condition: "Review 250 cards", icon: "shark" },
  { id: "cards-500", name: "Knowledge Machine", condition: "Review 500 cards", icon: "gear" },

  // ── Points milestones ──
  { id: "points-100", name: "Point Collector", condition: "Earn 100 points", icon: "coin" },
  { id: "points-500", name: "Point Hoarder", condition: "Earn 500 points", icon: "coins" },
  { id: "points-1000", name: "Grand Scorer", condition: "Earn 1,000 points", icon: "trophy-bronze" },
  { id: "points-5000", name: "Point Legend", condition: "Earn 5,000 points", icon: "trophy-gold" },

  // ── Streak badges ──
  { id: "streak-2", name: "Back Again", condition: "2-day streak", icon: "flame-spark" },
  { id: "streak-3", name: "Streak 3", condition: "3-day streak", icon: "flame-silver" },
  { id: "streak-5", name: "Streak 5", condition: "5-day streak", icon: "flame-bronze" },
  { id: "streak-7", name: "Full Week", condition: "7-day streak", icon: "flame-gold" },
  { id: "streak-14", name: "Two Weeks", condition: "14-day streak", icon: "flame-blue" },
  { id: "streak-30", name: "Monthly Blaze", condition: "30-day streak", icon: "flame-purple" },

  // ── Speed run badges ──
  { id: "speed-3-streak", name: "Combo Starter", condition: "3-card combo in speed run", icon: "lightning" },
  { id: "speed-5-streak", name: "On Fire", condition: "5-card combo in speed run", icon: "fire" },
  { id: "speed-10-streak", name: "Unstoppable", condition: "10-card combo in speed run", icon: "meteor" },
  { id: "speed-perfect-5", name: "Perfect Five", condition: "5/5 correct in a speed run", icon: "star-5" },
  { id: "speed-run-3", name: "Speed Addict", condition: "Complete 3 speed runs", icon: "repeat" },
  { id: "speed-run-10", name: "Speed Freak", condition: "Complete 10 speed runs", icon: "rocket" },

  // ── Session badges ──
  { id: "sessions-3", name: "Regular", condition: "Complete 3 sessions", icon: "calendar" },
  { id: "sessions-10", name: "Dedicated", condition: "Complete 10 sessions", icon: "target" },
  { id: "sessions-25", name: "Committed", condition: "Complete 25 sessions", icon: "medal" },

  // ── Topic mastery (per topic, early + advanced) ──
  { id: "linux-beginner", name: "Linux Learner", condition: "Linux mastery >= 25%", icon: "terminal-green" },
  { id: "linux-lord", name: "Linux Lord", condition: "Linux mastery >= 90%", icon: "terminal" },
  { id: "network-beginner", name: "Net Newbie", condition: "Networking mastery >= 25%", icon: "wifi-green" },
  { id: "network-pro", name: "Network Pro", condition: "Networking mastery >= 90%", icon: "wifi" },
  { id: "hardware-beginner", name: "Tinker", condition: "Hardware mastery >= 25%", icon: "wrench-green" },
  { id: "hardware-pro", name: "Hardware Pro", condition: "Hardware mastery >= 90%", icon: "wrench" },
  { id: "any-topic-50", name: "Halfway There", condition: "Any topic at 50% mastery", icon: "half-star" },
  { id: "all-topics-25", name: "Well-Rounded", condition: "All topics at 25%+ mastery", icon: "globe" },
  { id: "all-topics-50", name: "Balanced", condition: "All topics at 50%+ mastery", icon: "scales" },

  // ── Advanced / endgame ──
  { id: "scenario-slayer", name: "Scenario Slayer", condition: "50 scenario cards reviewed", icon: "crosshair" },
  { id: "mock-master", name: "Mock Master", condition: "5 mock interviews completed", icon: "signal" },
  { id: "cluster-ready", name: "Cluster Ready", condition: "Overall mastery >= 90%", icon: "star" },
  { id: "speed-demon", name: "Speed Demon", condition: "20+ cards in under 45 min", icon: "bolt" },
  { id: "tier-breaker", name: "Tier Breaker", condition: "First Tier 4 unlock", icon: "chain" },
  { id: "tier-2-any", name: "Level Up", condition: "Unlock Tier 2 in any topic", icon: "arrow-up" },
  { id: "tier-3-any", name: "Deep Dive", condition: "Unlock Tier 3 in any topic", icon: "arrow-up-2" },
  { id: "perfect-session", name: "Flawless", condition: "All cards rated Good or Easy in a session", icon: "diamond" },

  // ── Incident Drill badges ──
  { id: "first-drill", name: "First Responder", condition: "Complete your first incident drill", icon: "siren" },
  { id: "drill-3", name: "Incident Veteran", condition: "Complete 3 drills", icon: "shield" },
  { id: "drill-10", name: "Incident Commander", condition: "Complete 10 drills", icon: "shield-star" },
  { id: "drill-perfect", name: "Perfect Triage", condition: "Score 100% key-term coverage on a drill", icon: "bullseye" },
  { id: "drill-80", name: "Strong Responder", condition: "Score 80%+ on any drill", icon: "thumbs-up" },
  { id: "drill-all-scenarios", name: "Full Rotation", condition: "Complete every available scenario", icon: "rotate" },
];
