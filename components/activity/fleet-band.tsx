"use client";

import { useState } from "react";
import { isCloudConfigured } from "@/lib/cloud/config";
import FleetLogLive from "./fleet-log-live";
import WeeklyBoard from "./weekly-board";

type Tab = "log" | "board";

const TABS: Array<{ id: Tab; label: string; caption: string }> = [
  { id: "log", label: "Fleet Log", caption: "recent activity" },
  { id: "board", label: "Top pilots", caption: "XP this week" },
];

// The band on the Navigation Board: the Fleet Log, and — when there is a
// cloud — the week's top pilots, as two tabs so the radar keeps its space.
export default function FleetBand({ dense = false, max = 8 }: { dense?: boolean; max?: number }) {
  const [tab, setTab] = useState<Tab>("log");
  const tabs = isCloudConfigured() ? TABS : TABS.slice(0, 1);
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0">
        <div className="flex items-center gap-3">
          {tabs.length === 1 ? (
            <span className="text-[10px] display-font tracking-[0.14em] uppercase text-v2-text-muted">{tabs[0].label}</span>
          ) : (
            tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={active.id === t.id}
                onClick={() => setTab(t.id)}
                className={`text-[10px] display-font tracking-[0.14em] uppercase max-md:min-h-[44px] pb-0.5 transition-colors ${active.id === t.id ? "text-v2-cyan" : "text-v2-text-muted hover:text-v2-text-dim"}`}
                style={active.id === t.id ? { boxShadow: "inset 0 -1px 0 var(--color-v2-cyan)" } : undefined}
              >
                {t.label}
              </button>
            ))
          )}
        </div>
        <span className="text-[10px] telemetry-font text-v2-text-muted">{active.caption}</span>
      </div>
      <div className="min-h-0 overflow-y-auto pr-1">
        {active.id === "log" ? <FleetLogLive dense={dense} max={max} /> : <WeeklyBoard dense={dense} max={Math.min(max, 10)} />}
      </div>
    </div>
  );
}
