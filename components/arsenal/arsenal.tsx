"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBounty } from "@/lib/seeds/campaigns";
import type { MissionStep } from "@/lib/types/campaign";
import HexPanel from "@/components/ui/hex-panel";
import ScanOverlay from "@/components/ui/scan-overlay";
import StarfieldCanvas from "@/components/star-map/starfield-canvas";

import dynamic from "next/dynamic";
const StepRenderer = dynamic(() => import("@/components/mission/step-renderer"), { ssr: false });

// ── Activity data ──

interface Activity {
  id: string;
  title: string;
  description: string;
  category: "learn" | "practice" | "test" | "prepare" | "tools";
  difficulty?: "Easy" | "Medium" | "Hard" | "Mixed";
  topics: string[];
  estimatedMinutes: number;
  route: string;
}

const ACTIVITIES: Activity[] = [
  // LEARN
  { id: "boot-learn", title: "Boot Process — Learn", description: "Interactive 3-layer boot sequence walkthrough", category: "learn", topics: ["linux"], estimatedMinutes: 15, route: "/boot-learn" },
  { id: "filesystem-explorer", title: "Filesystem Navigator", description: "Interactive Linux directory tree with descriptions", category: "learn", topics: ["linux"], estimatedMinutes: 10, route: "/filesystem-navigator" },
  { id: "command-dissector", title: "Command Dissector", description: "Break down commands into parts — command, flags, arguments", category: "learn", topics: ["linux"], estimatedMinutes: 10, route: "/command-dissector" },
  { id: "fs-types", title: "Filesystem Types", description: "Compare ext4, XFS, btrfs, NFS, tmpfs, overlay", category: "learn", topics: ["linux"], estimatedMinutes: 8, route: "/filesystem-types" },
  // PRACTICE
  { id: "flashcards", title: "Flashcard Review", description: "Spaced-repetition review by topic, tier, or mixed", category: "practice", topics: ["linux", "hardware", "networking", "fiber", "power-cooling", "ops-processes", "scale"], estimatedMinutes: 10, route: "/study" },
  { id: "qd-permissions", title: "Quick Draw: Permissions", description: "Convert between rwx and octal notation", category: "practice", difficulty: "Medium", topics: ["linux"], estimatedMinutes: 5, route: "/train/quick-draw" },
  { id: "qd-ports", title: "Quick Draw: Ports", description: "Match services to port numbers", category: "practice", difficulty: "Easy", topics: ["networking"], estimatedMinutes: 5, route: "/train/quick-draw" },
  { id: "qd-signals", title: "Quick Draw: Signals", description: "Signal names, numbers, and when to use them", category: "practice", difficulty: "Easy", topics: ["linux"], estimatedMinutes: 4, route: "/train/quick-draw" },
  { id: "qd-ip", title: "Quick Draw: IP Ranges", description: "Private ranges, subnets, CIDR notation", category: "practice", difficulty: "Medium", topics: ["networking"], estimatedMinutes: 5, route: "/train/quick-draw" },
  { id: "qd-ssh", title: "Quick Draw: SSH", description: "Build SSH and SCP commands from requirements", category: "practice", difficulty: "Medium", topics: ["linux"], estimatedMinutes: 5, route: "/train/quick-draw" },
  { id: "qd-commands", title: "Quick Draw: Commands", description: "Name the command from its description", category: "practice", difficulty: "Easy", topics: ["linux"], estimatedMinutes: 5, route: "/train/quick-draw" },
  { id: "qd-command-recall", title: "Quick Draw: Command Recall", description: "75 commands — given a description, name the command", category: "practice", difficulty: "Hard", topics: ["linux"], estimatedMinutes: 8, route: "/train/quick-draw" },
  { id: "qd-flag-sniper", title: "Quick Draw: Flag Sniper", description: "100+ flags — given a flag, name what it does", category: "practice", difficulty: "Hard", topics: ["linux"], estimatedMinutes: 8, route: "/train/quick-draw" },
  { id: "fs-label-quiz", title: "Filesystem Label Quiz", description: "Given a description, type the correct Linux path", category: "practice", difficulty: "Medium", topics: ["linux"], estimatedMinutes: 8, route: "/filesystem-navigator?mode=label" },
  { id: "terminal", title: "Terminal Simulator", description: "Practice Linux commands in a simulated environment", category: "practice", topics: ["linux"], estimatedMinutes: 15, route: "/terminal" },
  { id: "downtime-smash", title: "Downtime Smash", description: "Solve simulated datacenter tickets at 6 difficulty levels", category: "practice", difficulty: "Mixed", topics: ["linux", "hardware", "networking"], estimatedMinutes: 15, route: "/battle-station" },
  // TEST
  { id: "diagnosis", title: "Diagnosis Lab", description: "Multi-step troubleshooting scenarios by difficulty", category: "test", difficulty: "Mixed", topics: ["linux", "hardware", "networking"], estimatedMinutes: 10, route: "/train/diagnosis" },
  { id: "drills", title: "Incident Drills", description: "Live incident response scenarios with key-term scoring", category: "test", difficulty: "Hard", topics: ["linux", "hardware", "networking"], estimatedMinutes: 10, route: "/drill" },
  { id: "boot-triage", title: "Boot Triage", description: "Diagnose boot failures from symptoms and logs", category: "test", difficulty: "Medium", topics: ["linux"], estimatedMinutes: 10, route: "/boot-triage" },
  { id: "fs-types-quiz", title: "Filesystem Types Quiz", description: "Identify the filesystem from a scenario description", category: "test", difficulty: "Medium", topics: ["linux"], estimatedMinutes: 6, route: "/filesystem-types?mode=quiz" },
  // PREPARE
  { id: "stories", title: "Story Bank", description: "Build and rehearse STAR stories for interviews", category: "prepare", topics: ["behavioral"], estimatedMinutes: 10, route: "/stories" },
  // TOOLS
  { id: "cards", title: "Card Browser", description: "Browse and search all flashcards in the system", category: "tools", topics: [], estimatedMinutes: 5, route: "/cards" },
];

// ── Category config with SVG icons ──

const CATEGORIES: { key: string; label: string }[] = [
  { key: "learn", label: "Learn" },
  { key: "practice", label: "Practice" },
  { key: "test", label: "Test" },
  { key: "prepare", label: "Prepare" },
  { key: "tools", label: "Tools" },
];

const accentColor = "#22c55e";

// Minimal SVG icons for categories
function CategoryIcon({ cat, active }: { cat: string; active: boolean }) {
  const color = active ? accentColor : "#6a7288";
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: 1.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (cat) {
    case "learn":
      return <svg {...common}><path d="M2 12V4a1 1 0 011-1h4l1 1h5a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1z" /><line x1="6" y1="7" x2="10" y2="7" /><line x1="6" y1="9.5" x2="10" y2="9.5" /></svg>;
    case "practice":
      return <svg {...common}><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="3.5" /><circle cx="8" cy="8" r="1" fill={color} stroke="none" /></svg>;
    case "test":
      return <svg {...common}><path d="M6 2v4l-2 2v1h8V8l-2-2V2" /><line x1="4" y1="13" x2="12" y2="13" /><line x1="5.5" y1="2" x2="10.5" y2="2" /></svg>;
    case "prepare":
      return <svg {...common}><rect x="5" y="1" width="6" height="4" rx="1" /><path d="M3 5h10v3a5 5 0 01-10 0V5z" /><line x1="8" y1="13" x2="8" y2="15" /><line x1="5" y1="15" x2="11" y2="15" /></svg>;
    case "tools":
      return <svg {...common}><circle cx="6" cy="6" r="2.5" /><line x1="8" y1="8" x2="14" y2="14" strokeWidth={2} /><path d="M10 3l3 3-1.5 1.5L8.5 4.5z" /></svg>;
    default:
      return <svg {...common}><circle cx="8" cy="8" r="5" /></svg>;
  }
}

// Difficulty color
const diffColor = (d?: string) =>
  d === "Easy" ? "#22c55e" : d === "Medium" ? "#f59e0b" : d === "Hard" ? "#ef4444" : d === "Mixed" ? "#a855f7" : "#6a7288";

// ── Bounty Activity View ──

function BountyActivity({ bountyId }: { bountyId: string }) {
  const router = useRouter();
  const bounty = getBounty(bountyId);

  const handleComplete = useCallback(() => {
    router.back();
  }, [router]);

  if (!bounty) {
    return (
      <div className="h-[calc(100vh-var(--chrome-h))] w-full flex items-center justify-center">
        <HexPanel>
          <div className="py-8 text-center">
            <p className="text-[#8eafc8] text-sm mb-4">Bounty not found: {bountyId}</p>
            <button onClick={() => router.push("/arsenal")} className="text-sm text-[#50C8FF] hover:text-white transition-colors" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              Back to Arsenal
            </button>
          </div>
        </HexPanel>
      </div>
    );
  }

  const syntheticStep: MissionStep = {
    id: `bounty-${bounty.id}`,
    type: bounty.activityType === "flashcards" ? "flashcards" : bounty.activityType === "quick-draw" ? "quick-draw" : bounty.activityType === "diagnosis" ? "diagnosis" : bounty.activityType === "incident-drill" ? "assessment" : "interactive",
    label: bounty.title,
    description: bounty.description,
    estimatedMinutes: bounty.estimatedMinutes,
    required: false,
    contentRef: bounty.contentRef,
  };

  return (
    <div className="h-[calc(100vh-var(--chrome-h))] w-full relative overflow-hidden">
      <ScanOverlay />
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-v2-border shrink-0">
          <button onClick={() => router.back()} className="text-[#8eafc8] hover:text-white text-sm transition-colors" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>← Back</button>
          <div className="h-4 w-px bg-v2-border" />
          <div>
            <span className="text-[11px] tracking-widest uppercase" style={{ color: accentColor, fontFamily: "'Chakra Petch', sans-serif" }}>Bounty</span>
            <h1 className="display-font text-sm tracking-wider" style={{ color: "#e0e4ec" }}>{bounty.title}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] telemetry-font text-[#8eafc8]">~{bounty.estimatedMinutes} min</span>
            <span className="text-[11px] telemetry-font" style={{ color: accentColor }}>+{bounty.xpReward} XP</span>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <StepRenderer step={syntheticStep} onStepComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}

// ── Main Arsenal Component ──

export default function Arsenal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bountyId = searchParams.get("bounty");

  const [activeCategory, setActiveCategory] = useState<string>("learn");
  const [filter, setFilter] = useState("");

  if (bountyId) {
    return <BountyActivity bountyId={bountyId} />;
  }

  const items = ACTIVITIES.filter((a) => {
    if (a.category !== activeCategory) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.topics.some((t) => t.includes(q)) ||
      (a.difficulty && a.difficulty.toLowerCase().includes(q))
    );
  });

  const catLabel = CATEGORIES.find((c) => c.key === activeCategory)?.label ?? "";

  return (
    <div className="h-[calc(100vh-var(--chrome-h))] w-full relative overflow-hidden">
      <StarfieldCanvas />
      <ScanOverlay />
      <div className="viewport-vignette fixed inset-0 z-[8] pointer-events-none" />

      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="galaxy-header-bar">
          <div className="header-accent-line" />
          <div className="flex items-center gap-3">
            <div className="header-diamond" style={{ background: `${accentColor}66`, boxShadow: `0 0 8px ${accentColor}50` }} />
            <h1 className="galaxy-title" style={{ textShadow: `0 0 20px ${accentColor}40, 0 0 40px ${accentColor}15` }}>
              Arsenal
            </h1>
            <div className="header-diamond" style={{ background: `${accentColor}66`, boxShadow: `0 0 8px ${accentColor}50` }} />
          </div>
          <div className="header-accent-line" />
        </div>
      </div>

      {/* Main layout */}
      <div className="absolute inset-0 z-[5] flex pt-11 pb-1 px-1 gap-2">
        {/* Category sidebar — glass panel */}
        <div className="w-16 sm:w-20 shrink-0 flex flex-col">
          <div className="glass-panel-header text-center">
            <span>Rack</span>
          </div>
          <div className="flex-1 glass-panel rounded-b-lg flex flex-col items-center py-3 gap-1 overflow-hidden">
            {CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className="w-12 sm:w-14 py-2 rounded flex flex-col items-center justify-center gap-1 transition-all duration-200"
                style={{
                  background: activeCategory === key ? `${accentColor}15` : "transparent",
                  border: activeCategory === key ? `1px solid ${accentColor}40` : "1px solid transparent",
                }}
                title={label}
              >
                <CategoryIcon cat={key} active={activeCategory === key} />
                <span
                  className="text-[10px] tracking-widest uppercase"
                  style={{
                    fontFamily: "'Chakra Petch', sans-serif",
                    color: activeCategory === key ? accentColor : "#6a7288",
                  }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content — glass panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="glass-panel-header">
            <span>{catLabel} Activities</span>
            <div className="flex-1" />
            <input
              type="text"
              placeholder="Filter..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border border-v2-border rounded px-2 py-0.5 text-[10px] text-v2-text placeholder:text-v2-text-muted focus:border-[#22c55e50] focus:outline-none w-28 sm:w-36"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          <div className="flex-1 glass-panel rounded-b-lg overflow-auto scroll-container p-3 sm:p-4">
            {/* Activity grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {items.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => router.push(activity.route)}
                  className="text-left group transition-all duration-200"
                >
                  <div
                    className="px-3 py-2.5 rounded-lg"
                    style={{
                      background: `${accentColor}04`,
                      border: `1px solid ${accentColor}12`,
                    }}
                  >
                    {/* Title row */}
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ background: accentColor, boxShadow: `0 0 4px ${accentColor}60` }}
                      />
                      <h3
                        className="text-[13px] display-font tracking-wider uppercase truncate group-hover:text-white transition-colors"
                        style={{ color: "#e0e4ec" }}
                      >
                        {activity.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-[12px] text-[#8eafc8] leading-snug mb-2 line-clamp-1 pl-3">
                      {activity.description}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 pl-3">
                      <span className="text-[11px] telemetry-font text-[#6a7288]">
                        ~{activity.estimatedMinutes}m
                      </span>
                      {activity.difficulty && (
                        <>
                          <span className="text-[11px] text-[#333845]">|</span>
                          <span
                            className="text-[11px] telemetry-font uppercase tracking-wider"
                            style={{ color: diffColor(activity.difficulty) }}
                          >
                            {activity.difficulty}
                          </span>
                        </>
                      )}
                      {activity.topics.length > 0 && (
                        <>
                          <span className="text-[11px] text-[#333845]">|</span>
                          <span className="text-[11px] telemetry-font text-[#6a7288] truncate">
                            {activity.topics.slice(0, 2).join(", ")}
                          </span>
                        </>
                      )}
                      {/* Hover arrow */}
                      <svg
                        width="8" height="8" viewBox="0 0 8 8"
                        className="ml-auto shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                        fill="none" stroke={accentColor} strokeWidth="1.2"
                      >
                        <polyline points="2,1 6,4 2,7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-12 text-[#8eafc8] text-sm telemetry-font">
                No activities match your filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
