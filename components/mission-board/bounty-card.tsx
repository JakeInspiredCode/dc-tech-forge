"use client";

import type { BountyTemplate } from "@/lib/types/campaign";

interface BountyCardProps {
  bounty: BountyTemplate;
  campaignColor?: string;
  onClick: (bountyId: string) => void;
}

// Minimal SVG icons — thematic, no emoji
const TypeIcon = ({ type, color }: { type: string; color: string }) => {
  const stroke = color;
  const common = { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke, strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (type) {
    case "quick-draw":
      // Lightning bolt
      return <svg {...common}><polyline points="9 1 4 9 8 9 7 15 12 7 8 7 9 1" /></svg>;
    case "incident-drill":
      // Warning triangle
      return <svg {...common}><path d="M8 1.5 L14.5 13 H1.5 Z" /><line x1="8" y1="6" x2="8" y2="9" /><circle cx="8" cy="11" r="0.5" fill={stroke} stroke="none" /></svg>;
    case "diagnosis":
      // Crosshair/target
      return <svg {...common}><circle cx="8" cy="8" r="5" /><line x1="8" y1="1" x2="8" y2="4" /><line x1="8" y1="12" x2="8" y2="15" /><line x1="1" y1="8" x2="4" y2="8" /><line x1="12" y1="8" x2="15" y2="8" /></svg>;
    case "flashcards":
      // Stacked cards
      return <svg {...common}><rect x="3" y="1" width="10" height="12" rx="1" /><rect x="5" y="3" width="10" height="12" rx="1" /></svg>;
    case "terminal":
      // Terminal prompt
      return <svg {...common}><rect x="1" y="2" width="14" height="12" rx="1.5" /><polyline points="4 7 6.5 9 4 11" /><line x1="8" y1="11" x2="12" y2="11" /></svg>;
    default:
      return <svg {...common}><circle cx="8" cy="8" r="3" /></svg>;
  }
};

export default function BountyCard({ bounty, campaignColor, onClick }: BountyCardProps) {
  const color = campaignColor ?? "#06d6d6";

  return (
    <button
      type="button"
      onClick={() => onClick(bounty.id)}
      className="w-full text-left group transition-all duration-200"
    >
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded"
        style={{
          background: `${color}06`,
          border: `1px solid ${color}12`,
        }}
      >
        {/* Icon */}
        <div
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center"
          style={{ background: `${color}10` }}
        >
          <TypeIcon type={bounty.activityType} color={`${color}cc`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-[#e0e4ec] display-font tracking-wider truncate group-hover:text-white transition-colors">
            {bounty.title}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] telemetry-font text-v2-text-muted">
              {bounty.estimatedMinutes}m
            </span>
            <span className="text-[11px] text-v2-text-muted">|</span>
            <span className="text-[11px] telemetry-font" style={{ color }}>
              +{bounty.xpReward} XP
            </span>
          </div>
        </div>

        {/* Arrow */}
        <svg
          width="10" height="10" viewBox="0 0 10 10"
          className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
          fill="none" stroke={color} strokeWidth="1.2"
        >
          <polyline points="3,2 7,5 3,8" />
        </svg>
      </div>
    </button>
  );
}
