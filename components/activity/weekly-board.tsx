"use client";

import Link from "next/link";
import { useWeeklyBoard } from "@/lib/cloud/board";
import { usePilot } from "@/lib/cloud/pilot";

// Top pilots this week. XP earned since Monday (UTC), as the cloud counted it
// from each pilot's saves; your own row reads "(you)".
export default function WeeklyBoard({ dense = false, max = 5 }: { dense?: boolean; max?: number }) {
  const pilot = usePilot();
  const { rows, status } = useWeeklyBoard(10);
  const text = dense ? "text-[11px]" : "text-xs";

  if (status === "off") return null;
  const shown = rows.slice(0, max);

  return (
    <div className="flex flex-col gap-1.5">
      {shown.length === 0 ? (
        <p className={`text-v2-text-muted leading-relaxed ${text}`}>
          {status === "loading" ? "Checking the board…" : status === "offline" ? "The board can't be reached right now." : "No XP earned this week yet — be the first."}
        </p>
      ) : (
        <ol aria-label="Top pilots this week" className={dense ? "space-y-1" : "space-y-1.5"}>
          {shown.map((row, i) => {
            const you = pilot?.callsign === row.callsign;
            return (
              <li key={row.callsign} className="flex items-baseline gap-2 min-w-0">
                <span aria-hidden="true" className="w-4 shrink-0 text-right telemetry-font text-[10px] text-v2-text-muted">{i + 1}</span>
                <span className={`flex-1 min-w-0 truncate mono ${text} ${you ? "text-v2-cyan" : "text-v2-text"}`}>
                  {row.callsign}
                  {you && <span className="text-v2-text-dim"> (you)</span>}
                </span>
                <span className={`shrink-0 telemetry-font ${text} text-v2-text`}>
                  {row.xp.toLocaleString()} <span className="text-[10px] text-v2-text-muted">XP</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {!pilot && status !== "loading" && (
        <p className={`text-v2-text-muted leading-snug ${dense ? "text-[10px]" : "text-xs"}`}>
          Ranked by XP earned since Monday. <Link href="/profile" className="text-v2-cyan underline-offset-2 hover:underline">Claim a callsign</Link> to be counted.
        </p>
      )}
    </div>
  );
}
