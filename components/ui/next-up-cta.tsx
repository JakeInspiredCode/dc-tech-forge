"use client";

import Link from "next/link";
import { missionHref, type NextUp } from "@/lib/mission/next-up";

// The primary action on both maps: one obvious thing to do next. It is a real
// link, so it works by keyboard and touch — unlike the planets around it.
export default function NextUpCta({
  next,
  scope,
}: {
  /** null while saved progress is still loading. */
  next: NextUp | null;
  /** "galaxy" names the campaign too; on a campaign's own map that's redundant. */
  scope: "galaxy" | "campaign";
}) {
  // Until progress has loaded we don't know the answer, and a confident wrong
  // one ("Start here: Mission 1" to someone on Mission 5) is worse than none:
  // it is the primary action, and a quick click would open the wrong mission.
  if (next === null) {
    return (
      <div
        aria-hidden="true"
        className={`rounded-md animate-pulse ${scope === "galaxy" ? "h-[68px]" : "h-[52px]"}`}
        style={{ background: "color-mix(in srgb, var(--color-v2-cyan) 6%, transparent)" }}
      />
    );
  }

  if (next.kind === "all-done") {
    return (
      <p
        role="status"
        className="px-3 py-2.5 rounded-md text-xs leading-relaxed text-v2-text"
        style={{
          background: "color-mix(in srgb, var(--color-v2-success) 10%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-v2-success) 40%, transparent)",
        }}
      >
        {scope === "campaign"
          ? "Campaign complete — every mission here is done. Reopen any mission to practice."
          : "Every mission is done. Reopen any sector to practice."}
      </p>
    );
  }

  return (
    <Link
      href={missionHref(next.missionId)}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors"
      style={{
        background: "color-mix(in srgb, var(--color-v2-cyan) 12%, transparent)",
        border: "1px solid color-mix(in srgb, var(--color-v2-cyan) 55%, transparent)",
      }}
    >
      <span className="flex-1 min-w-0">
        <span className="block text-[11px] tracking-widest uppercase text-v2-amber-bright">
          {next.kind === "start" ? "Start here" : "Continue"}
        </span>
        <span className="block display-font text-sm text-v2-text truncate">
          Mission {next.missionNumber}: {next.missionTitle}
        </span>
        {scope === "galaxy" && <span className="block text-xs text-v2-text truncate">{next.campaignTitle}</span>}
      </span>
      <span aria-hidden="true" className="text-v2-cyan text-lg transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}
