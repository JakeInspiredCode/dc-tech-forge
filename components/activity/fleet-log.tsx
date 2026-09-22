"use client";

import { useEffect, useState } from "react";
import { describeActivity, formatRelativeTime } from "@/lib/activity/describe";
import { useActivityNames } from "@/lib/activity/names";
import type { ActivityFields, Doc } from "@/lib/data/schema";

export interface FleetLogEntry extends Pick<ActivityFields, "kind" | "ref" | "value" | "at"> {
  id: string;
  /** Who did it. Null is the person looking at the screen. */
  actor: string | null;
}

/** This browser's own rows, as entries. */
export function ownEntries(rows: ReadonlyArray<Doc<ActivityFields>>): FleetLogEntry[] {
  return rows.map((r) => ({ id: r._id, actor: null, kind: r.kind, ref: r.ref, value: r.value, at: r.at }));
}

interface Props {
  entries: FleetLogEntry[];
  /** Show at most this many rows that describe; the rest stay in the store. */
  max?: number;
  /** Tighter rows, for the home board. */
  dense?: boolean;
  emptyText?: string;
  /** The list's accessible name. */
  label?: string;
}

// "4m ago" goes stale on a screen left open, so tick once a minute.
function useNow(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [enabled]);
  return now;
}

// The Fleet Log: what was done, most recent first. Each row is a sentence
// built from ids by describeActivity — a row that names nothing shipped is
// skipped, so a removed mission or a hostile backup can't put words here.
export default function FleetLog({
  entries,
  max,
  dense = false,
  emptyText = "Nothing logged yet.",
  label = "Recent activity",
}: Props) {
  const names = useActivityNames(entries);
  const now = useNow(entries.length > 0);

  const rows: Array<{ entry: FleetLogEntry; line: NonNullable<ReturnType<typeof describeActivity>> }> = [];
  for (const entry of entries) {
    if (max !== undefined && rows.length >= max) break;
    const line = describeActivity(entry, names);
    if (line) rows.push({ entry, line });
  }

  if (rows.length === 0) {
    return <p className={`text-v2-text-muted leading-relaxed ${dense ? "text-[11px]" : "text-xs"}`}>{emptyText}</p>;
  }

  return (
    <ol aria-label={label} className={dense ? "space-y-1.5" : "space-y-2"}>
      {rows.map(({ entry, line }) => (
        <li key={entry.id} className="flex items-start gap-2 min-w-0">
          <span aria-hidden="true" className="shrink-0 w-4 text-center text-v2-cyan text-[11px] leading-5">
            {line.glyph}
          </span>
          <span className={`flex-1 min-w-0 leading-5 text-v2-text-dim ${dense ? "text-[11px]" : "text-xs"}`}>
            <span className="text-v2-text font-semibold">{entry.actor ?? "You"}</span>{" "}
            {line.parts.map((part, i) =>
              typeof part === "string" ? (
                <span key={i}>{part}</span>
              ) : (
                <span key={i} className="text-v2-text">{part.name}</span>
              ),
            )}
          </span>
          <time
            dateTime={entry.at}
            title={new Date(entry.at).toLocaleString()}
            className="shrink-0 telemetry-font text-[10px] leading-5 text-v2-text-muted"
          >
            {formatRelativeTime(entry.at, now)}
          </time>
        </li>
      ))}
    </ol>
  );
}
