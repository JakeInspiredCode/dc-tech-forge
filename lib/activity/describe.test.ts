import { describe, expect, it } from "vitest";
import { ALL_BOUNTIES, ALL_CAMPAIGNS, ALL_MISSIONS } from "@/lib/seeds/campaigns";
import { getAllModules } from "@/lib/seeds/quick-draw-modules";
import { BADGE_DEFS } from "@/lib/types";
import { describeActivity, formatRelativeTime, LAZY_KINDS } from "./describe";
import { LAZY_NAME_KINDS, loadNames } from "./names";

describe("describeActivity", () => {
  it("names what was done, and highlights the name", () => {
    const mission = ALL_MISSIONS[0];
    const line = describeActivity({ kind: "mission_accomplished", ref: mission.id, value: 90 });
    expect(line?.text).toBe(`accomplished ${mission.title} — 90%`);
    expect(line?.parts).toContainEqual({ name: mission.title });

    expect(describeActivity({ kind: "campaign_completed", ref: ALL_CAMPAIGNS[0].id })?.text).toBe(`completed the ${ALL_CAMPAIGNS[0].title} campaign`);
    expect(describeActivity({ kind: "badge_earned", ref: "cards-100" })?.text).toBe("earned the Centurion badge");
    expect(describeActivity({ kind: "speed_run", ref: "linux", value: 420 })?.text).toBe("scored 420 pts in a Linux Operations Speed Run");
    expect(describeActivity({ kind: "speed_run", ref: "mixed", value: 10 })?.text).toBe("scored 10 pts in a Mixed topics Speed Run");
    expect(describeActivity({ kind: "session_completed", ref: "daily-training", value: 20 })?.text).toBe("finished a study session — 20 cards");
    expect(describeActivity({ kind: "bounty_completed", ref: ALL_BOUNTIES[0].id })?.text).toBe(`completed the bounty ${ALL_BOUNTIES[0].title}`);
    expect(BADGE_DEFS.some((b) => b.id === "cards-100")).toBe(true);
  });

  it("drops a row whose id matches nothing shipped, and a kind it does not know", () => {
    expect(describeActivity({ kind: "mission_accomplished", ref: "lx-m99" })).toBeNull();
    expect(describeActivity({ kind: "campaign_completed", ref: "" })).toBeNull();
    expect(describeActivity({ kind: "badge_earned", ref: "curious-mind" })).toBeNull();
    expect(describeActivity({ kind: "speed_run", ref: "cooking" })).toBeNull();
    expect(describeActivity({ kind: "bounty_completed", ref: "<b>hi</b>" })).toBeNull();
    expect(describeActivity({ kind: "not-a-kind" as never, ref: "x" })).toBeNull();
  });

  it("reads generically until a lazy kind's names arrive, then by name — or not at all", async () => {
    expect(describeActivity({ kind: "quick_draw", ref: "permissions", value: 94 })?.text).toBe("scored 94% on Quick Draw");
    expect(describeActivity({ kind: "ticket_resolved", ref: "orientation", value: 92 })?.text).toBe("resolved a ticket in Battlestation — 92%");
    expect(describeActivity({ kind: "drill_completed", ref: "x", value: 85 })?.text).toBe("completed a drill — 85%");
    expect(describeActivity({ kind: "diagnosis_solved", ref: "x", value: 88 })?.text).toBe("solved a diagnosis scenario — 88%");

    const names = { quick_draw: (await loadNames("quick_draw"))!, ticket_resolved: (await loadNames("ticket_resolved"))! };
    const title = getAllModules().find((m) => m.id === "permissions")!.title;
    expect(describeActivity({ kind: "quick_draw", ref: "permissions", value: 94 }, names)?.text).toBe(`scored 94% on Quick Draw: ${title}`);
    expect(describeActivity({ kind: "ticket_resolved", ref: "orientation", value: 92 }, names)?.text).toBe("resolved an Orientation ticket in Battlestation — 92%");
    expect(describeActivity({ kind: "quick_draw", ref: "nope" }, names)).toBeNull();
    expect(describeActivity({ kind: "ticket_resolved", ref: "impossible" }, names)).toBeNull();
  });

  it("has a name loader for exactly the lazy kinds, each resolving real content", async () => {
    expect(new Set(LAZY_NAME_KINDS)).toEqual(LAZY_KINDS);
    for (const kind of LAZY_NAME_KINDS) {
      const table = await loadNames(kind);
      expect(Object.keys(table!).length, kind).toBeGreaterThan(0);
      for (const title of Object.values(table!)) expect(title.length, kind).toBeGreaterThan(2);
    }
    expect(loadNames("mission_accomplished")).toBeNull();
  });
});

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-09-22T12:00:00.000Z");
  it.each([
    ["2026-09-22T11:59:40.000Z", "just now"],
    ["2026-09-22T11:56:00.000Z", "4m ago"],
    ["2026-09-22T09:00:00.000Z", "3h ago"],
    ["2026-09-20T12:00:00.000Z", "2d ago"],
    ["2026-09-22T12:05:00.000Z", "just now"], // a clock ahead of ours is not "in 5m"
  ])("%s → %s", (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });

  it("falls back to a date after a week, and to nothing for garbage", () => {
    expect(formatRelativeTime("2026-09-01T12:00:00.000Z", now)).toMatch(/Sep/);
    expect(formatRelativeTime("not a date", now)).toBe("");
  });
});
