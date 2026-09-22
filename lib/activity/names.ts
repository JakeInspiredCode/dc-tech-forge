"use client";

// The Fleet Log names things by id. Missions, campaigns, badges, topics and
// bounties are on every page already. Drills, diagnosis scenarios, Quick Draw
// modules and ticket levels are not, and are fetched here only when a row of
// that kind is actually on screen: the home page must not pay for content it
// isn't showing (the same rule lib/bundle-boundaries.test.ts enforces for
// lessons and quizzes).

import { useEffect, useState } from "react";
import type { ActivityKind } from "@/lib/data/schema";
import type { NameTable } from "./describe";

type Loader = () => Promise<Record<string, string>>;

const LOADERS: Partial<Record<ActivityKind, Loader>> = {
  drill_completed: async () => {
    const { SCENARIOS } = await import("@/lib/scenarios");
    return Object.fromEntries(SCENARIOS.map((s) => [s.id, s.title]));
  },
  diagnosis_solved: async () => {
    const { default: scenarios } = await import("@/lib/seeds/diagnosis-scenarios");
    return Object.fromEntries(scenarios.map((s) => [s.id, s.title]));
  },
  quick_draw: async () => {
    const { getAllModules } = await import("@/lib/seeds/quick-draw-modules");
    return Object.fromEntries(getAllModules().map((m) => [m.id, m.title]));
  },
  ticket_resolved: async () => {
    const { TICKET_LEVELS } = await import("@/lib/ticket-scenarios");
    return Object.fromEntries(Object.entries(TICKET_LEVELS).map(([id, level]) => [id, level.label]));
  },
};

export const LAZY_NAME_KINDS = Object.keys(LOADERS) as ActivityKind[];

const inflight = new Map<ActivityKind, Promise<Record<string, string>>>();
let known: NameTable = {};

/** The names for one kind, fetched once per page load. Null for a kind that needs none. */
export function loadNames(kind: ActivityKind): Promise<Record<string, string>> | null {
  const loader = LOADERS[kind];
  if (!loader) return null;
  let pending = inflight.get(kind);
  if (!pending) {
    pending = loader().then((table) => {
      known = { ...known, [kind]: table };
      return table;
    });
    // A failed fetch (offline, a stale build) is retried on the next mount.
    pending.catch(() => inflight.delete(kind));
    inflight.set(kind, pending);
  }
  return pending;
}

/** Names for whatever kinds `rows` contain, filled in as they arrive. */
export function useActivityNames(rows: ReadonlyArray<{ kind: ActivityKind }>): NameTable {
  const [names, setNames] = useState<NameTable>(() => known);
  const wanted = [...new Set(rows.map((r) => r.kind))]
    .filter((kind) => LOADERS[kind] && !names[kind])
    .sort()
    .join(",");

  useEffect(() => {
    if (!wanted) return;
    let cancelled = false;
    for (const kind of wanted.split(",") as ActivityKind[]) {
      loadNames(kind)
        ?.then(() => {
          if (!cancelled) setNames(known);
        })
        .catch(() => {
          // The row keeps its generic wording.
        });
    }
    return () => {
      cancelled = true;
    };
  }, [wanted]);

  return names;
}
