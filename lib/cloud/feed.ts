"use client";

// The shared Fleet Log: what other pilots did, read from the fleet_log view.
// Rows are data from strangers, so each is checked before it is believed;
// describeActivity then drops any whose ids name nothing shipped.

import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIVITY_KINDS, type ActivityKind } from "@/lib/data/schema";
import { CALLSIGN_RE } from "./callsign";
import { isCloudConfigured } from "./config";
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

export type FeedStatus = "off" | "loading" | "live" | "offline";

const POLL_MS = 60_000;
const MIN_REFRESH_GAP_MS = 5_000;

/** The shared log, refreshed every minute while the tab is visible, on focus, and after this browser publishes. */
export function useFleetLog(limit = 40): { rows: FeedRow[]; status: FeedStatus; refresh: () => void } {
  const configured = isCloudConfigured();
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [status, setStatus] = useState<FeedStatus>(configured ? "loading" : "off");
  const lastRef = useRef(0);

  const refresh = useCallback(() => {
    if (!configured) return;
    const now = Date.now();
    if (now - lastRef.current < MIN_REFRESH_GAP_MS) return;
    lastRef.current = now;
    fetchFleetLog(limit)
      .then((fresh) => {
        setRows(fresh);
        setStatus("live");
      })
      .catch(() => setStatus("offline"));
  }, [configured, limit]);

  useEffect(() => {
    if (!configured) return;
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const onPublished = () => {
      lastRef.current = 0;
      refresh();
    };
    window.addEventListener(PUBLISHED_EVENT, onPublished);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener(PUBLISHED_EVENT, onPublished);
    };
  }, [configured, refresh]);

  return { rows, status, refresh };
}
