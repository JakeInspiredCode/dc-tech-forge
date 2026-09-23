import { describe, expect, it } from "vitest";
import { mergeFleetLog } from "@/components/activity/fleet-log-live";
import { validateFeedRow, type FeedRow } from "./feed";

const good = { id: 7, callsign: "nova_7", kind: "mission_accomplished", ref: "linux-m01", value: 90, created_at: "2026-09-22T10:00:00.000Z" };

describe("validateFeedRow", () => {
  it("accepts a well-formed row and normalizes it", () => {
    expect(validateFeedRow(good)).toEqual({ id: "cloud-7", callsign: "nova_7", kind: "mission_accomplished", ref: "linux-m01", value: 90, at: good.created_at });
    expect(validateFeedRow({ ...good, value: null })).toMatchObject({ value: undefined });
    expect(validateFeedRow({ ...good, value: "88" })).toMatchObject({ value: 88 });
  });

  it("drops anything a stranger could have bent", () => {
    expect(validateFeedRow({ ...good, callsign: "Nova 7" })).toBeNull();
    expect(validateFeedRow({ ...good, callsign: "<b>x</b>" })).toBeNull();
    expect(validateFeedRow({ ...good, kind: "hacked" })).toBeNull();
    expect(validateFeedRow({ ...good, ref: "x".repeat(65) })).toBeNull();
    expect(validateFeedRow({ ...good, created_at: "yesterday" })).toBeNull();
    expect(validateFeedRow({ ...good, value: "lots" })).toBeNull();
    expect(validateFeedRow({ ...good, id: null })).toBeNull();
    expect(validateFeedRow("row")).toBeNull();
  });
});

describe("mergeFleetLog", () => {
  const pilot = { callsign: "nova_7", code: "0".repeat(32), pilotId: "p" };
  const local = [{ _id: "l1", _creationTime: 1, kind: "badge_earned" as const, ref: "cards-10", at: "2026-09-22T09:00:00.000Z" }];
  const shared: FeedRow[] = [
    { id: "cloud-2", callsign: "rack_rat", kind: "ticket_resolved", ref: "orientation", value: 92, at: "2026-09-22T10:00:00.000Z" },
    { id: "cloud-1", callsign: "nova_7", kind: "mission_accomplished", ref: "linux-m01", value: 90, at: "2026-09-22T08:00:00.000Z" },
  ];
  const outbox = [{ id: "o1", t: 2, kind: "quick_draw" as const, ref: "ports", value: 80, at: "2026-09-22T11:00:00.000Z" }];

  it("shows your own rows when signed out or when there is no cloud", () => {
    expect(mergeFleetLog({ pilot: null, status: "live", shared, outbox, local }).map((e) => e.id)).toEqual(["l1"]);
    expect(mergeFleetLog({ pilot, status: "off", shared, outbox, local }).map((e) => e.id)).toEqual(["l1"]);
  });

  it("shows the shared log when signed in — you as “You”, pending rows first by time", () => {
    const merged = mergeFleetLog({ pilot, status: "live", shared, outbox, local });
    expect(merged.map((e) => e.id)).toEqual(["pending-o1", "cloud-2", "cloud-1"]);
    expect(merged.map((e) => e.actor)).toEqual([null, "rack_rat", null]);
  });

  it("falls back to your own rows only when the cloud is unreachable and nothing is cached", () => {
    expect(mergeFleetLog({ pilot, status: "offline", shared: [], outbox, local }).map((e) => e.id)).toEqual(["l1"]);
    expect(mergeFleetLog({ pilot, status: "offline", shared, outbox, local }).map((e) => e.id)).toEqual(["pending-o1", "cloud-2", "cloud-1"]);
  });
});
