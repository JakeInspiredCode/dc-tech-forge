"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import FleetLog, { ownEntries, type FleetLogEntry } from "@/components/activity/fleet-log";
import { useFleetLog, type FeedRow, type FeedStatus } from "@/lib/cloud/feed";
import { usePilot, type Pilot } from "@/lib/cloud/pilot";
import { readOutbox, subscribeOutbox, type OutboxRow } from "@/lib/cloud/sync";
import { useRecentActivity } from "@/lib/convex-hooks";
import type { ActivityFields, Doc } from "@/lib/data/schema";

/**
 * What the Fleet Log shows. Signed out: this browser's own rows. Signed in:
 * the shared log (own rows read "You") plus anything still waiting to be
 * published — and, if the cloud can't be reached, the local rows instead.
 */
export function mergeFleetLog(input: {
  pilot: Pilot | null;
  status: FeedStatus;
  shared: FeedRow[];
  outbox: OutboxRow[];
  local: Doc<ActivityFields>[];
}): FleetLogEntry[] {
  const { pilot, status, shared, outbox, local } = input;
  if (!pilot || status === "off") return ownEntries(local);
  if (status !== "live" && shared.length === 0) return ownEntries(local);
  const pending: FleetLogEntry[] = outbox.map((o) => ({ id: `pending-${o.id}`, actor: null, kind: o.kind, ref: o.ref, value: o.value, at: o.at }));
  const theirs: FleetLogEntry[] = shared.map((r) => ({ id: r.id, actor: r.callsign === pilot.callsign ? null : r.callsign, kind: r.kind, ref: r.ref, value: r.value, at: r.at }));
  return [...pending, ...theirs].sort((a, b) => b.at.localeCompare(a.at));
}

const emptyOutbox: OutboxRow[] = [];
function useOutbox(): OutboxRow[] {
  return useSyncExternalStore(subscribeOutbox, readOutboxCached, () => emptyOutbox);
}
// useSyncExternalStore needs a stable snapshot; re-read only when told.
let outboxSnapshot: OutboxRow[] | null = null;
function readOutboxCached(): OutboxRow[] {
  if (outboxSnapshot === null) outboxSnapshot = readOutbox();
  return outboxSnapshot;
}
subscribeOutboxOnce();
function subscribeOutboxOnce() {
  if (typeof window === "undefined") return;
  subscribeOutbox(() => {
    outboxSnapshot = null;
  });
}

export default function FleetLogLive({ dense = false, max }: { dense?: boolean; max?: number }) {
  const pilot = usePilot();
  const local = useRecentActivity(max ?? 200);
  const { rows: shared, status } = useFleetLog(max ? Math.max(max, 20) : 60);
  const outbox = useOutbox();
  const entries = mergeFleetLog({ pilot, status, shared, outbox, local });

  const note =
    status === "off" ? null
    : !pilot ? <>Signed out: your own activity. <Link href="/profile" className="text-v2-cyan underline-offset-2 hover:underline">Claim a callsign</Link> to save it across devices and appear here.</>
    : status === "offline" && shared.length === 0 ? "The shared log can't be reached right now — showing your own activity."
    : status === "offline" ? "The shared log can't be refreshed right now."
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      <FleetLog
        entries={entries}
        dense={dense}
        max={max}
        label="Fleet Log — recent activity"
        emptyText={pilot && status === "live" ? "Nothing in the log yet — be the first: finish a mission, a drill or a ticket." : "Nothing logged yet. Finish a mission, a drill or a ticket and it appears here."}
      />
      {note && <p className={`text-v2-text-muted leading-snug ${dense ? "text-[10px]" : "text-xs"}`}>{note}</p>}
    </div>
  );
}
