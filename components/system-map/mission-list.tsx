"use client";

import Link from "next/link";
import type { Mission, MissionStatus } from "@/lib/types/campaign";
import { missionHref } from "@/lib/mission/next-up";

// The campaign map on a phone. The orbit graphic draws mission titles at ~6px
// there, and its preview needs a hover that touch doesn't have — so below `lg`
// the missions are an ordered list that shows what the hover preview would:
// status, time, steps. Same order, same destination.

const STATUS: Record<MissionStatus, { word: string; color: string }> = {
  locked: { word: "Locked", color: "var(--color-v2-text-muted)" },
  available: { word: "Not started", color: "var(--color-v2-text-dim)" },
  "in-progress": { word: "In progress", color: "var(--color-v2-cyan)" },
  accomplished: { word: "Completed", color: "var(--color-v2-green-bright)" },
  decaying: { word: "Needs review", color: "var(--color-v2-amber-bright)" },
};

export default function MissionList({
  missions,
  statuses,
  currentMissionIndex,
  campaignColor,
  onOpen,
}: {
  missions: Mission[];
  statuses: Record<string, MissionStatus>;
  currentMissionIndex: number;
  campaignColor: string;
  /** Same action as clicking a planet: open the mission with its default loadout. */
  onOpen: (mission: Mission) => void;
}) {
  return (
    <ol aria-label="Missions, in order" className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {missions.map((mission, i) => {
        const status = statuses[mission.id] ?? "available";
        const isCurrent = i === currentMissionIndex && status !== "accomplished";
        const done = status === "accomplished";
        return (
          <li key={mission.id}>
            <Link
              href={missionHref(mission.id)}
              onClick={(e) => {
                e.preventDefault();
                onOpen(mission);
              }}
              aria-current={isCurrent ? "step" : undefined}
              className="glass-panel rounded-lg flex items-center gap-3 px-3 py-3 min-h-[64px]"
              style={isCurrent ? { borderColor: campaignColor } : undefined}
            >
              <span
                aria-hidden="true"
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center telemetry-font text-xs font-semibold"
                style={{
                  color: done ? "#050508" : campaignColor,
                  background: done ? campaignColor : "transparent",
                  border: `1.5px solid ${campaignColor}`,
                }}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block display-font text-sm text-v2-text truncate">
                  <span className="sr-only">Mission {i + 1}: </span>
                  {mission.title}
                </span>
                <span className="block text-xs mt-0.5 telemetry-font">
                  <span style={{ color: STATUS[status].color }}>
                    {isCurrent ? "Up next · " : ""}
                    {STATUS[status].word}
                  </span>
                  <span className="text-v2-text-muted">
                    {" "}· {mission.estimatedMinutes} min · {mission.defaultLoadout.length} steps
                  </span>
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
