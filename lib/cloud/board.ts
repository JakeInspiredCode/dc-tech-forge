"use client";

// Top pilots this week: callsigns ranked by XP earned since Monday (UTC), from
// the weekly_board view. Rows come from strangers' saves, so each is checked.

import { CALLSIGN_RE } from "./callsign";
import { isCloudConfigured } from "./config";
import { usePolled, type PollStatus } from "./polled";
import { select } from "./postgrest";
import { PUBLISHED_EVENT, SAVED_EVENT } from "./sync";

export interface BoardRow {
  callsign: string;
  xp: number;
}

export function validateBoardRow(raw: unknown): BoardRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.callsign !== "string" || !CALLSIGN_RE.test(r.callsign)) return null;
  const xp = Number(r.xp);
  if (!Number.isFinite(xp) || xp < 0) return null;
  return { callsign: r.callsign, xp: Math.round(xp) };
}

export async function fetchWeeklyBoard(limit = 10): Promise<BoardRow[]> {
  const rows = await select<unknown>("weekly_board", `select=callsign,xp&limit=${limit}`);
  return rows
    .map(validateBoardRow)
    .filter((r): r is BoardRow => r !== null)
    .sort((a, b) => b.xp - a.xp);
}

export type BoardStatus = PollStatus;

const REFRESH_ON = [SAVED_EVENT, PUBLISHED_EVENT];

/** The board, refreshed like the Fleet Log — and right after this browser saves. */
export function useWeeklyBoard(limit = 10): { rows: BoardRow[]; status: BoardStatus; refresh: () => void } {
  return usePolled<BoardRow>(isCloudConfigured(), () => fetchWeeklyBoard(limit), REFRESH_ON);
}
