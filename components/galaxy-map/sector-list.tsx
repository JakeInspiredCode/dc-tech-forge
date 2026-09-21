"use client";

import Link from "next/link";
import type { Sector, SectorProgress } from "@/lib/types/campaign";
import { campaignHref } from "@/lib/mission/flow";

// The galaxy map on a phone. At 375px the SVG map draws its labels at 5px and
// its planets as 20px tap targets, so below `lg` the same eight sectors are a
// list instead: same order, same links, same progress — readable and tappable.
export default function SectorList({
  sectors,
  progress,
}: {
  sectors: Sector[];
  progress: Record<string, SectorProgress>;
}) {
  return (
    <ol aria-label="Sectors" className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {sectors.map((sector) => {
        const p = progress[sector.id];
        const campaignId = sector.campaignIds[0];
        if (!p || !campaignId) return null;
        const pct = p.totalMissions > 0 ? Math.round((p.completedMissions / p.totalMissions) * 100) : 0;
        return (
          <li key={sector.id}>
            <Link
              href={campaignHref(campaignId)}
              data-sector-id={sector.id}
              className="glass-panel rounded-lg flex items-center gap-3 px-4 py-3 min-h-[68px]"
            >
              <span
                aria-hidden="true"
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: sector.color, boxShadow: `0 0 10px ${sector.color}` }}
              />
              <span className="flex-1 min-w-0">
                <span className="block display-font text-sm text-v2-text truncate">{sector.title}</span>
                <span className="block text-xs text-v2-text-muted telemetry-font mt-0.5">
                  {p.isComplete ? "Complete · " : ""}
                  {p.completedMissions}/{p.totalMissions} missions
                </span>
                <span aria-hidden="true" className="block h-1 rounded-full mt-2 overflow-hidden bg-v2-bg-overlay">
                  <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: sector.color }} />
                </span>
              </span>
              <span aria-hidden="true" className="text-v2-text-dim text-lg shrink-0">
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
