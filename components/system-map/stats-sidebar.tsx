"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Campaign, Mission, MissionStatus, BountyTemplate } from "@/lib/types/campaign";
import { getMission, ALL_BOUNTIES } from "@/lib/seeds/campaigns";
import HexPanel from "@/components/ui/hex-panel";
import ActionButton from "@/components/ui/action-button";
import StatusBadge from "@/components/ui/status-badge";
import BountyCard from "@/components/mission-board/bounty-card";
import NextUpCta from "@/components/ui/next-up-cta";
import { nextUp } from "@/lib/mission/next-up";

interface StatsSidebarProps {
  campaign: Campaign | undefined;
  missions: Mission[];
  missionStatuses: Record<string, MissionStatus>;
  completedCount: number;
  totalMissions: number;
  currentMissionIndex: number;
  campaignXp: number;
  totalXp: number;
  streak: number;
  decayingMissionIds: string[];
  hasNoCampaign: boolean;
  campaignColor: string;
  /** False while saved progress is still loading. */
  ready: boolean;
}

type PanelSize = "full" | "mid" | "compact";

const MID_THRESHOLD = 500;
const COMPACT_THRESHOLD = 360;

// ── Smart bounty recommendation engine ──
//
// Picks the 3 bounties most likely to help the student right now, based on:
//
// 1. CONTENT AFFINITY — bounties whose contentRef matches a quick-draw module
//    or card-set the student has already encountered in completed missions.
//    Reviewing practiced content cements it; reviewing unseen content is noise.
//
// 2. DECAY PRIORITY — if any missions are decaying, flashcard review for that
//    topic/tier jumps to the top. The student needs to stop the bleed.
//
// 3. RECENCY WEIGHTING — recently completed missions' content is freshest and
//    most at risk of the "forgetting curve" drop. We favor bounties that
//    reinforce the last 2–3 completed missions over older ones.
//
// 4. PROGRESS GATING — T2/T3 bounties only appear after enough campaign
//    progress (40% → T2, 75% → T3). Keeps the challenge level appropriate.
//
// 5. VARIETY — caps any single activity type at 2 out of 3 slots, so the
//    student gets a mix (e.g., flashcards + quick-draw, not 3 flashcard sets).

function getRecommendedBounties(
  campaign: Campaign | undefined,
  missions: Mission[],
  missionStatuses: Record<string, MissionStatus>,
  decayingMissionIds: string[],
): BountyTemplate[] {
  if (!campaign) return ALL_BOUNTIES.slice(0, 3);

  const topicBounties = ALL_BOUNTIES.filter((b) => b.topicId === campaign.topicId);
  if (topicBounties.length === 0) return ALL_BOUNTIES.slice(0, 3);

  // Gather completed mission data
  const completedMissions = missions.filter(
    (m) => missionStatuses[m.id] === "accomplished",
  );
  const completedCount = completedMissions.length;
  const progressPct = missions.length > 0 ? completedCount / missions.length : 0;

  // Tier ceiling based on campaign progress
  const maxTier = progressPct < 0.4 ? 1 : progressPct < 0.75 ? 2 : 3;

  // Build a set of contentRef IDs the student has practiced in missions
  // (quick-draw modules, card-set IDs, diagnosis scenarios)
  const practicedContentIds = new Set<string>();
  for (const mission of completedMissions) {
    for (const step of mission.defaultLoadout) {
      if (step.contentRef?.id) {
        practicedContentIds.add(step.contentRef.id);
      }
    }
  }

  // Also gather content from the current in-progress mission
  const inProgressMissions = missions.filter(
    (m) => missionStatuses[m.id] === "in-progress" || missionStatuses[m.id] === "available",
  );
  for (const mission of inProgressMissions.slice(0, 1)) {
    for (const step of mission.defaultLoadout) {
      if (step.contentRef?.id) {
        practicedContentIds.add(step.contentRef.id);
      }
    }
  }

  // Recently completed missions (last 3) — these need reinforcement most
  const recentMissions = completedMissions.slice(-3);
  const recentContentIds = new Set<string>();
  for (const mission of recentMissions) {
    for (const step of mission.defaultLoadout) {
      if (step.contentRef?.id) {
        recentContentIds.add(step.contentRef.id);
      }
    }
  }

  // Decaying mission content — urgent review
  const decayingContentIds = new Set<string>();
  for (const mid of decayingMissionIds) {
    const mission = missions.find((m) => m.id === mid);
    if (mission) {
      for (const step of mission.defaultLoadout) {
        if (step.contentRef?.id) {
          decayingContentIds.add(step.contentRef.id);
        }
      }
    }
  }

  // Score each bounty
  const scored: { bounty: BountyTemplate; score: number; reason: string }[] = [];

  for (const bounty of topicBounties) {
    let score = 0;
    let reason = "Review";

    // --- Tier gating ---
    if (bounty.tier > maxTier) {
      score -= 10; // hard gate — won't surface unless nothing else fits
    }

    // --- Content affinity ---
    // Does this bounty's contentRef match something the student has done?
    const bountyContentId = bounty.contentRef?.id;
    if (bountyContentId && practicedContentIds.has(bountyContentId)) {
      score += 4;
      reason = "Reinforce";
    }

    // Even stronger if it matches recently completed content
    if (bountyContentId && recentContentIds.has(bountyContentId)) {
      score += 3;
      reason = "Recent";
    }

    // Strongest if it matches decaying content — urgent
    if (bountyContentId && decayingContentIds.has(bountyContentId)) {
      score += 6;
      reason = "Slipping";
    }

    // --- Decay-aware activity preference ---
    if (decayingMissionIds.length > 0) {
      // When knowledge is decaying, flashcards are the best medicine
      if (bounty.activityType === "flashcards") score += 4;
      if (bounty.activityType === "quick-draw") score += 1;
    } else if (completedCount === 0) {
      // No completed missions yet — nothing to review
      // Prefer the simplest, most foundational bounties
      if (bounty.activityType === "flashcards" && bounty.tier === 1) score += 2;
    } else {
      // Normal flow — balanced reinforcement
      if (bounty.activityType === "flashcards") score += 2;
      if (bounty.activityType === "quick-draw") score += 2;
      if (bounty.activityType === "diagnosis") score += 1;
    }

    // --- Progress-appropriate difficulty ---
    if (bounty.tier === 1 && progressPct < 0.4) score += 1;
    if (bounty.tier === 2 && progressPct >= 0.4 && progressPct < 0.75) score += 1;
    if (bounty.tier === 3 && progressPct >= 0.75) score += 1;

    // --- Late-campaign unlocks ---
    if (progressPct > 0.6) {
      if (bounty.activityType === "diagnosis") score += 1;
      if (bounty.activityType === "incident-drill") score += 1;
    }

    scored.push({ bounty, score, reason });
  }

  // Also consider mixed review if student has progress (cross-content reinforcement)
  if (completedCount >= 3) {
    const mixedReview = ALL_BOUNTIES.find((b) => b.id === "bounty-cards-mixed");
    if (mixedReview && !scored.some((s) => s.bounty.id === mixedReview.id)) {
      scored.push({
        bounty: mixedReview,
        score: decayingMissionIds.length > 0 ? 6 : 3,
        reason: decayingMissionIds.length > 0 ? "Slipping" : "Reinforce",
      });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Pick top 3, enforcing variety (max 2 of any activity type)
  const result: { bounty: BountyTemplate; reason: string }[] = [];
  const typeCounts: Record<string, number> = {};

  for (const entry of scored) {
    if (result.length >= 3) break;
    const tc = typeCounts[entry.bounty.activityType] ?? 0;
    if (tc >= 2) continue;
    result.push({ bounty: entry.bounty, reason: entry.reason });
    typeCounts[entry.bounty.activityType] = tc + 1;
  }

  // Backfill if we still need more
  for (const entry of scored) {
    if (result.length >= 3) break;
    if (!result.some((r) => r.bounty.id === entry.bounty.id)) {
      result.push({ bounty: entry.bounty, reason: entry.reason });
    }
  }

  return result.map((r) => r.bounty);
}

/** Glowing circular gauge */
function GlowGauge({
  value,
  label,
  max,
  suffix,
  color,
  delay = 0,
  size = "full",
}: {
  value: number;
  label: string;
  max?: number;
  suffix?: string;
  color: string;
  delay?: number;
  size?: "full" | "mid";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const r = 30;
  const circumference = 2 * Math.PI * r;
  const pct = max ? Math.min(value / max, 1) : Math.min(value / 10000, 1);
  const dashOffset = mounted ? circumference * (1 - pct) : circumference;
  const displayValue = max ? `${value}/${max}` : value.toLocaleString();

  const px = size === "mid" ? "44px" : "60px";
  const labelSize = size === "mid" ? "text-[10px]" : "text-[11px]";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: px, height: px }}>
        <svg width="100%" height="100%" viewBox="0 0 78 78">
          <circle
            cx="39" cy="39" r={r + 5}
            fill="none" stroke={color} strokeWidth="0.5"
            opacity={mounted ? 0.15 : 0}
            className="transition-opacity duration-700"
          />
          <circle
            cx="39" cy="39" r={r}
            fill="none" stroke={color} strokeWidth="3"
            opacity={0.08}
          />
          <circle
            cx="39" cy="39" r={r}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 39 39)"
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
          <circle
            cx="39" cy="39" r={r - 6}
            fill={`${color}06`}
            stroke={color}
            strokeWidth="0.3"
            opacity={0.3}
          />
          <text
            x="39" y={suffix ? "36" : "39"}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize="13"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="700"
            style={{ textShadow: `0 0 12px ${color}` }}
          >
            {displayValue}
          </text>
          {suffix && (
            <text
              x="39" y="48"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#8eafc8"
              fontSize="8"
              fontFamily="'Space Grotesk', sans-serif"
              fontWeight="500"
              letterSpacing="0.1em"
            >
              {suffix}
            </text>
          )}
        </svg>
      </div>
      <span className={`${labelSize} display-font tracking-[0.14em] text-[#8eafc8] uppercase`}>
        {label}
      </span>
    </div>
  );
}

/** Single inline stat for compact mode */
function InlineStat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 4px ${color}60` }}
      />
      <span
        className="text-sm telemetry-font font-semibold text-v2-text truncate"
        style={{ textShadow: `0 0 8px ${color}30` }}
      >
        {value}
      </span>
      <span className="text-[10px] display-font tracking-[0.1em] text-v2-text-muted uppercase shrink-0">
        {label}
      </span>
    </div>
  );
}

export default function StatsSidebar({
  campaign,
  missions,
  missionStatuses,
  completedCount,
  totalMissions,
  currentMissionIndex,
  campaignXp,
  totalXp,
  streak,
  decayingMissionIds,
  hasNoCampaign,
  campaignColor,
  ready,
}: StatsSidebarProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelSize, setPanelSize] = useState<PanelSize>("full");

  // Smart bounty recommendations
  const recommendedBounties = useMemo(
    () => getRecommendedBounties(campaign, missions, missionStatuses, decayingMissionIds),
    [campaign, missions, missionStatuses, decayingMissionIds],
  );

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      setPanelSize(h < COMPACT_THRESHOLD ? "compact" : h < MID_THRESHOLD ? "mid" : "full");
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleBountyClick = (bountyId: string) => {
    router.push(`/arsenal?bounty=${bountyId}`);
  };

  const campaignPct = totalMissions > 0 ? Math.round((completedCount / totalMissions) * 100) : 0;

  const next = useMemo(
    () =>
      !ready ? null :
      nextUp(
        campaign
          ? [{ id: campaign.id, title: campaign.title, missions: missions.map((m) => ({ id: m.id, title: m.title })) }]
          : [],
        (missionId) => missionStatuses[missionId],
      ),
    [ready, campaign, missions, missionStatuses],
  );

  return (
    <div ref={panelRef} className="h-full flex flex-col p-3 overflow-auto scroll-container">
      {hasNoCampaign ? (
        <div className="flex-1 flex items-center justify-center">
          <HexPanel className="text-center">
            <p className="text-xs text-[#8eafc8] mb-3">
              No campaign selected. Pick a sector on the Galaxy Map to open one.
            </p>
            <ActionButton variant="primary" size="sm" onClick={() => router.push("/")}>
              Galaxy Map
            </ActionButton>
          </HexPanel>
        </div>
      ) : (
        <>
          {/* Stats gauges */}
          {panelSize === "compact" ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
              <InlineStat value={campaignXp.toLocaleString()} label="Campaign XP" color={campaignColor} />
              <InlineStat value={`${streak}d`} label="Streak" color="#f59e0b" />
              <InlineStat value={`${completedCount}/${totalMissions}`} label="Missions" color="#22c55e" />
              <InlineStat value={`${campaignPct}%`} label="Progress" color="#a855f7" />
            </div>
          ) : (
            <div className={`grid grid-cols-2 justify-items-center mb-2 ${panelSize === "mid" ? "gap-1" : "gap-1.5"}`}>
              <GlowGauge value={campaignXp} label="Campaign XP" color={campaignColor} delay={100} size={panelSize} />
              <GlowGauge value={streak} label="Streak" suffix="DAYS" color="#f59e0b" max={30} delay={250} size={panelSize} />
              <GlowGauge value={completedCount} label="Missions" max={totalMissions} color="#22c55e" delay={400} size={panelSize} />
              <GlowGauge value={campaignPct} label="Progress" suffix="%" max={100} color="#a855f7" delay={550} size={panelSize} />
            </div>
          )}

          {/* Active Campaign card */}
          {campaign && (
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md mb-1"
              style={{
                background: `${campaignColor}08`,
                border: `1px solid ${campaignColor}1a`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: campaignColor, boxShadow: `0 0 6px ${campaignColor}80` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{campaign.icon}</span>
                  <span className="text-xs text-[#e0e4ec] display-font tracking-wider block truncate">
                    {campaign.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: `${campaignColor}1a` }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${campaignPct}%`,
                        background: `linear-gradient(90deg, ${campaignColor}, ${campaignColor}cc)`,
                        boxShadow: `0 0 6px ${campaignColor}66`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] telemetry-font text-[#8eafc8]">
                    Mission {currentMissionIndex + 1}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* The one thing to do next in this campaign */}
          {campaign && (
            <div className="mb-3 mt-1">
              <NextUpCta next={next} scope="campaign" />
            </div>
          )}

          {/* Territory Defense */}
          {decayingMissionIds.length > 0 && (
            <div className="mb-3">
              <h2
                className="text-[11px] tracking-widest uppercase mb-2 flex items-center gap-1"
                style={{ color: "#f59e0b", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                &#9888; Territory Defense
              </h2>
              <div className="space-y-1.5">
                {decayingMissionIds.slice(0, 3).map((mid) => {
                  const m = getMission(mid);
                  return (
                    <HexPanel
                      key={mid}
                      size="sm"
                      glowColor="warning"
                      onClick={() => router.push(`/missions/${mid}`)}
                      className="cursor-pointer hover:border-v2-warning/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-v2-text truncate">
                          {m?.title ?? mid}
                        </span>
                        <StatusBadge label="Review" variant="warning" />
                      </div>
                    </HexPanel>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bounties — smart recommendations */}
      <div className="pt-2" style={{ borderTop: `1px solid ${campaignColor}15` }}>
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <h2
              className="text-[11px] tracking-widest uppercase leading-none"
              style={{ color: campaignColor, fontFamily: "'Space Grotesk', sans-serif", opacity: 0.85 }}
            >
              Bounties
            </h2>
            <span className="text-[10px] text-v2-text-muted tracking-wider uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Suggested review
            </span>
          </div>
          <button
            onClick={() => router.push("/arsenal")}
            className="text-[11px] hover:text-v2-text transition-colors tracking-wider"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: `${campaignColor}cc` }}
          >
            All activities &rarr;
          </button>
        </div>
        <div className="space-y-1">
          {recommendedBounties.map((bounty) => (
            <BountyCard
              key={bounty.id}
              bounty={bounty}
              campaignColor={campaignColor}
              onClick={handleBountyClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
