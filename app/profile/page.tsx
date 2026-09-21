"use client";

import { useState } from "react";
import { useQuery } from "@/lib/convex-shim";
import { api } from "@/convex/_generated/api";
import TelemetryBar from "@/components/ui/telemetry-bar";
import ScanOverlay from "@/components/ui/scan-overlay";
import StarfieldCanvas from "@/components/star-map/starfield-canvas";
import { TOPICS } from "@/lib/types";
import { resetPersistedData } from "@/lib/data/persistence";
import DataSettings from "@/components/profile/data-settings";
import { BRAND } from "@/lib/brand";
import { V2 } from "@/lib/design/forge-v2-tokens";

const RESET_PHRASE = "RESET";
const dangerColor = "#ef4444";

type Tab = "stats" | "badges" | "settings";

const accentColor = "#e0e4ec";
const accentGlow = "rgba(224, 228, 236, 0.2)";

// ── SVG icons for tabs ──
function TabIcon({ tab, active }: { tab: string; active: boolean }) {
  const color = active ? accentColor : V2.text.muted;
  const common = { width: 12, height: 12, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (tab) {
    case "stats":
      return <svg {...common}><polyline points="2 12 5 6 9 9 14 2" /><line x1="2" y1="14" x2="14" y2="14" /></svg>;
    case "badges":
      return <svg {...common}><polygon points="8 1 10 5 14 5.5 11 8.5 12 13 8 10.5 4 13 5 8.5 2 5.5 6 5" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="8" cy="8" r="2.5" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" /></svg>;
    default:
      return null;
  }
}

// ── Stat gauge (matching Galaxy Map GlowGauge pattern) ──
function ProfileGauge({ value, label, suffix, color, max }: { value: number | string; label: string; suffix?: string; color: string; max?: number }) {
  const numVal = typeof value === "string" ? parseInt(value) || 0 : value;
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const pct = max ? Math.min(numVal / max, 1) : Math.min(numVal / 10000, 1);
  const dashOffset = circumference * (1 - pct);
  const displayValue = typeof value === "string" ? value : max ? `${value}/${max}` : value.toLocaleString();

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 48, height: 48 }}>
        <svg width="100%" height="100%" viewBox="0 0 68 68">
          <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="2.5" opacity={0.08} />
          <circle
            cx="34" cy="34" r={r}
            fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            strokeLinecap="round" transform="rotate(-90 34 34)"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)", filter: `drop-shadow(0 0 4px ${color}60)` }}
          />
          <text
            x="34" y={suffix ? "31" : "34"}
            textAnchor="middle" dominantBaseline="central"
            fill="#ffffff" fontSize="11"
            fontFamily="'JetBrains Mono', monospace" fontWeight="700"
            style={{ textShadow: `0 0 8px ${color}` }}
          >
            {displayValue}
          </text>
          {suffix && (
            <text x="34" y="42" textAnchor="middle" dominantBaseline="central" fill="#8eafc8" fontSize="6" fontFamily="'Chakra Petch', sans-serif" fontWeight="600" letterSpacing="0.12em">
              {suffix}
            </text>
          )}
        </svg>
      </div>
      <span className="text-[10px] display-font tracking-[0.14em] text-[#8eafc8] uppercase">{label}</span>
    </div>
  );
}

// ── Badge icon (SVG, no emoji) ──
function BadgeIcon({ earned }: { earned: boolean }) {
  const color = earned ? accentColor : V2.text.muted;
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      {/* Hexagon */}
      <polygon
        points="16 2 28 9 28 23 16 30 4 23 4 9"
        fill={earned ? `${accentColor}10` : "transparent"}
        stroke={color}
        strokeWidth={1.2}
      />
      {/* Inner mark */}
      {earned && (
        <polyline points="11 16 14.5 19.5 21 12" stroke={accentColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function ProfilePage() {
  const profile = useQuery(api.forgeProfile.get) as {
    streak?: number; totalPoints?: number; badges?: string[];
    totalSessionMinutes?: number; lastSessionDate?: string;
  } | null | undefined;
  const allProgress = useQuery(api.forgeProgress.getAll) as Array<{
    topicId: string; masteryPercent: number; currentTier: number;
    totalCards: number; masteredCards: number; learningCards: number;
    newCards: number; weakFlag: boolean;
  }> | undefined;
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [resetArming, setResetArming] = useState(false);
  const [resetPhrase, setResetPhrase] = useState("");

  const handleReset = () => {
    resetPersistedData();
    window.location.reload();
  };

  const cancelReset = () => {
    setResetArming(false);
    setResetPhrase("");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "Stats" },
    { id: "badges", label: "Badges" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="h-[calc(100vh-var(--chrome-h))] w-full relative overflow-hidden">
      <StarfieldCanvas />
      <ScanOverlay />
      <div className="viewport-vignette fixed inset-0 z-[8] pointer-events-none" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="galaxy-header-bar">
          <div className="header-accent-line" />
          <div className="flex items-center gap-3">
            <div className="header-diamond" style={{ background: `${accentColor}40`, boxShadow: `0 0 8px ${accentGlow}` }} />
            <h1 className="galaxy-title" style={{ textShadow: `0 0 20px ${accentGlow}, 0 0 40px rgba(224,228,236,0.08)` }}>
              Operator Profile
            </h1>
            <span className="galaxy-subtitle">Progress &amp; settings</span>
            <div className="header-diamond" style={{ background: `${accentColor}40`, boxShadow: `0 0 8px ${accentGlow}` }} />
          </div>
          <div className="header-accent-line" />
        </div>
      </div>

      {/* Main layout */}
      <div className="absolute inset-0 z-[5] flex flex-col sm:flex-row pt-11 pb-1 px-1 gap-2">
        {/* Left panel — identity card */}
        <div className="sm:w-56 md:w-64 lg:w-72 shrink-0 flex flex-col">
          <div className="glass-panel-header">
            <span>Identity</span>
          </div>
          <div className="flex-1 glass-panel rounded-b-lg flex flex-col items-center p-4 sm:p-5 overflow-auto">
            {/* Avatar */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 shrink-0"
              style={{
                background: `${accentColor}06`,
                border: `1.5px solid ${accentColor}20`,
                boxShadow: `0 0 20px ${accentColor}08`,
              }}
            >
              {/* Stylized operator sigil */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity={0.5}>
                <polygon points="14 2 26 8 26 20 14 26 2 20 2 8" />
                <polygon points="14 7 21 11 21 19 14 23 7 19 7 11" />
                <circle cx="14" cy="14" r="2" fill={accentColor} stroke="none" opacity={0.6} />
              </svg>
            </div>

            <div
              className="text-[11px] display-font tracking-[0.2em] uppercase mb-1"
              style={{ color: accentColor }}
            >
              Operator
            </div>
            <div className="text-[11px] telemetry-font text-[#8eafc8] mb-4">
              {profile?.streak ?? 0}d streak
            </div>

            {/* Divider */}
            <div className="w-full h-px mb-4 shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}20, transparent)` }} />

            {/* Stats gauges */}
            <div className="grid grid-cols-2 gap-2 w-full justify-items-center">
              <ProfileGauge value={profile?.totalPoints ?? 0} label="Total XP" color={accentColor} />
              <ProfileGauge value={profile?.streak ?? 0} label="Streak" suffix="DAYS" color="#f59e0b" max={30} />
              <ProfileGauge value={profile?.badges?.length ?? 0} label="Badges" color="#a855f7" max={20} />
              <ProfileGauge value={`${Math.round(profile?.totalSessionMinutes ?? 0)}`} label="Minutes" suffix="STUDY" color="#06d6d6" />
            </div>
          </div>
        </div>

        {/* Right panel — tabbed content */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="glass-panel-header flex items-center gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-0 transition-all duration-200"
                style={{
                  color: activeTab === tab.id ? accentColor : V2.text.muted,
                  borderBottom: activeTab === tab.id ? `1px solid ${accentColor}60` : "1px solid transparent",
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                <TabIcon tab={tab.id} active={activeTab === tab.id} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 glass-panel rounded-b-lg overflow-auto scroll-container p-3 sm:p-5">
            {/* ── Stats Tab ── */}
            {activeTab === "stats" && (
              <div className="max-w-xl space-y-4">
                <div>
                  <h2
                    className="text-[11px] tracking-widest uppercase mb-3"
                    style={{ color: accentColor, fontFamily: "'Chakra Petch', sans-serif", opacity: 0.7 }}
                  >
                    Topic Mastery
                  </h2>
                  <div className="space-y-2.5">
                    {TOPICS.map((topic) => {
                      const progress = allProgress?.find((p) => p.topicId === topic.id);
                      return (
                        <TelemetryBar
                          key={topic.id}
                          value={progress?.masteryPercent ?? 0}
                          label={topic.name}
                          color={
                            (progress?.masteryPercent ?? 0) >= 85 ? "success" :
                            (progress?.masteryPercent ?? 0) >= 50 ? "cyan" : "warning"
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Badges Tab ── */}
            {activeTab === "badges" && (
              <div className="max-w-xl">
                <div className="flex items-center justify-between mb-3">
                  <h2
                    className="text-[11px] tracking-widest uppercase"
                    style={{ color: accentColor, fontFamily: "'Chakra Petch', sans-serif", opacity: 0.7 }}
                  >
                    Earned Badges
                  </h2>
                  <span className="text-[11px] telemetry-font text-v2-text-muted">
                    {profile?.badges?.length ?? 0} earned
                  </span>
                </div>
                {profile?.badges && profile.badges.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {profile.badges.map((badge) => (
                      <div
                        key={badge}
                        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg"
                        style={{
                          background: `${accentColor}04`,
                          border: `1px solid ${accentColor}12`,
                        }}
                      >
                        <BadgeIcon earned />
                        <span className="text-[11px] text-[#8eafc8] text-center display-font tracking-wider uppercase">
                          {badge.replace(/-/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="py-8 text-center rounded-lg"
                    style={{ background: `${accentColor}03`, border: `1px solid ${accentColor}08` }}
                  >
                    <BadgeIcon earned={false} />
                    <p className="text-[11px] text-[#8eafc8] mt-2">
                      Complete activities to earn badges.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Settings Tab ── */}
            {activeTab === "settings" && (
              <div className="max-w-xl space-y-4">
                <DataSettings />

                <div>
                  <h2
                    className="text-[11px] tracking-widest uppercase mb-3"
                    style={{ color: dangerColor, fontFamily: "'Chakra Petch', sans-serif", opacity: 0.85 }}
                  >
                    Danger Zone
                  </h2>
                  <div
                    className="rounded-lg p-3 sm:p-4 space-y-3"
                    style={{
                      background: `${dangerColor}08`,
                      border: `1px solid ${dangerColor}28`,
                    }}
                  >
                    <p className="text-[11px] leading-relaxed" style={{ color: "#e6ebf5" }}>
                      Erases everything {BRAND.name} has saved in this browser — progress, stories,
                      profile, and preferences — and restarts from a fresh account. This cannot be
                      undone.
                    </p>

                    {!resetArming ? (
                      <button
                        onClick={() => setResetArming(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
                        style={{
                          background: `${dangerColor}10`,
                          border: `1px solid ${dangerColor}40`,
                          color: dangerColor,
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke={dangerColor}
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 4h10" />
                          <path d="M5 4V2.5h6V4" />
                          <path d="M4 4l1 9.5h6L12 4" />
                          <line x1="6.5" y1="7" x2="6.5" y2="11" />
                          <line x1="9.5" y1="7" x2="9.5" y2="11" />
                        </svg>
                        <span
                          className="text-[11px] display-font tracking-wider uppercase"
                          style={{ color: dangerColor }}
                        >
                          Reset all local data
                        </span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <label
                          className="block text-[11px] display-font tracking-wider uppercase"
                          style={{ color: "#e6ebf5" }}
                        >
                          Type <span style={{ color: dangerColor }}>{RESET_PHRASE}</span> to confirm
                        </label>
                        <input
                          type="text"
                          autoFocus
                          value={resetPhrase}
                          onChange={(e) => setResetPhrase(e.target.value)}
                          placeholder={RESET_PHRASE}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                          style={{
                            background: "rgba(10,14,22,0.6)",
                            border: `1px solid ${dangerColor}30`,
                            color: "#ffffff",
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: "0.1em",
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleReset}
                            disabled={resetPhrase !== RESET_PHRASE}
                            className="px-3 py-1.5 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                            style={{
                              background:
                                resetPhrase === RESET_PHRASE
                                  ? `${dangerColor}20`
                                  : `${dangerColor}06`,
                              border: `1px solid ${
                                resetPhrase === RESET_PHRASE
                                  ? `${dangerColor}70`
                                  : `${dangerColor}20`
                              }`,
                              color:
                                resetPhrase === RESET_PHRASE ? dangerColor : V2.text.muted,
                              opacity: resetPhrase === RESET_PHRASE ? 1 : 0.8,
                            }}
                          >
                            <span className="text-[11px] display-font tracking-wider uppercase">
                              Confirm Reset
                            </span>
                          </button>
                          <button
                            onClick={cancelReset}
                            className="px-3 py-1.5 rounded-lg transition-all duration-200"
                            style={{
                              background: `${accentColor}06`,
                              border: `1px solid ${accentColor}20`,
                              color: "#e6ebf5",
                            }}
                          >
                            <span className="text-[11px] display-font tracking-wider uppercase">
                              Cancel
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
