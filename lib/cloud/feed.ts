"use client";

// The shared Fleet Log: what other pilots did, read from the fleet_log view.
// Rows are data from strangers, so each is checked before it is believed;
// describeActivity then drops any whose ids name nothing shipped.

import { ACTIVITY_KINDS, type ActivityKind } from "@/lib/data/schema";
import { CALLSIGN_RE } from "./callsign";
import { isCloudConfigured } from "./config";
import { usePolled, type PollStatus } from "./polled";
import { select } from "./postgrest";
import { PUBLISHED_EVENT } from "./sync";

export interface FeedRow {
  id: string;
  callsign: string;
  kind: ActivityKind;
  ref: string;
  value?: number;
  at: string;
}

const KINDS = new Set<string>(ACTIVITY_KINDS);

export function validateFeedRow(raw: unknown): FeedRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.callsign !== "string" || !CALLSIGN_RE.test(r.callsign)) return null;
  if (typeof r.kind !== "string" || !KINDS.has(r.kind)) return null;
  if (typeof r.ref !== "string" || r.ref.length > 64) return null;
  if (typeof r.created_at !== "string" || Number.isNaN(Date.parse(r.created_at))) return null;
  const value = r.value === null || r.value === undefined ? undefined : Number(r.value);
  if (value !== undefined && !Number.isFinite(value)) return null;
  const id = typeof r.id === "number" || typeof r.id === "string" ? String(r.id) : null;
  if (id === null) return null;
  return { id: `cloud-${id}`, callsign: r.callsign, kind: r.kind as ActivityKind, ref: r.ref, value, at: r.created_at };
}

export async function fetchFleetLog(limit = 40): Promise<FeedRow[]> {
  const rows = await select<unknown>("fleet_log", `select=id,callsign,kind,ref,value,created_at&limit=${limit}`);
  return rows.map(validateFeedRow).filter((r): r is FeedRow => r !== null);
}

export type FeedStatus = PollStatus;

const REFRESH_ON = [PUBLISHED_EVENT];

/** The shared log, refreshed every minute while the tab is visible, on focus, and after this browser publishes. */
export function useFleetLog(limit = 40): { rows: FeedRow[]; status: FeedStatus; refresh: () => void } {
  return usePolled<FeedRow>(isCloudConfigured(), () => fetchFleetLog(limit), REFRESH_ON);
}
