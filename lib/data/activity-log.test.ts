import { beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_MISSIONS, getMissionsForCampaign } from "@/lib/seeds/campaigns";
import type { ActivityFields, Doc } from "./schema";

// The store is a module-level singleton, so every test gets a fresh one.
async function load() {
  vi.resetModules();
  const store = await import("./store");
  const { seedIfEmpty } = await import("./seed");
  const { mutations, queries } = await import("./operations");
  seedIfEmpty();
  const recent = (limit?: number) => queries["forgeActivity:getRecent"]({ limit }) as Doc<ActivityFields>[];
  return { ...store, mutations, recent };
}

beforeEach(() => localStorage.clear());

const ticket = (i: number) => ({
  ticketId: `t${i}`, difficulty: "orientation", score: i, commandsUsed: [], answer: "", usedHint: false, xpEarned: 1, timeMs: 1,
});

describe("the Fleet Log", () => {
  it("logs a mission the first time its knowledge check is passed — not on a fail, not on a retake", async () => {
    const { mutations, recent } = await load();
    const id = ALL_MISSIONS[0].id;

    await mutations["forgeMissions:submitKnowledgeCheck"]({ missionId: id, score: 0.6, passed: false, xpEarned: 0 });
    expect(recent()).toEqual([]);

    await mutations["forgeMissions:submitKnowledgeCheck"]({ missionId: id, score: 0.9, passed: true, xpEarned: 100 });
    await mutations["forgeMissions:submitKnowledgeCheck"]({ missionId: id, score: 1, passed: true, xpEarned: 100 });

    expect(recent()).toHaveLength(1);
    expect(recent()[0]).toMatchObject({ kind: "mission_accomplished", ref: id, value: 90 });
  });

  it("logs the campaign when its last mission is accomplished, above that mission", async () => {
    const { mutations, recent } = await load();
    const campaignId = ALL_MISSIONS[0].campaignId;
    const missions = getMissionsForCampaign(campaignId);

    for (const m of missions) {
      await mutations["forgeMissions:submitKnowledgeCheck"]({ missionId: m.id, score: 1, passed: true, xpEarned: 1 });
    }

    const rows = recent();
    expect(rows.filter((r) => r.kind === "campaign_completed")).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "campaign_completed", ref: campaignId });
    expect(rows[1]).toMatchObject({ kind: "mission_accomplished", ref: missions[missions.length - 1].id });
    expect(rows).toHaveLength(missions.length + 1);
  });

  it("logs sessions, speed runs, drills, diagnoses, quick draws, tickets, bounties and badges", async () => {
    const { mutations, recent } = await load();
    await mutations["forgeSessions:add"]({
      type: "daily-training", startTime: "2026-09-20T10:00:00.000Z", endTime: "2026-09-20T10:20:00.000Z", cardIds: ["a", "b", "c"], answers: [],
    });
    await mutations["forgeSpeedRuns:add"]({
      timestamp: "2026-09-21T10:00:00.000Z", topicId: "linux", cardTypeFilter: [], startingTime: 60, totalCards: 5, correctCards: 5,
      partialCards: 0, wrongCards: 0, totalPoints: 420, bestStreak: 5, avgResponseMs: 1000, cardResults: [],
    });
    await mutations["forgeDrills:add"]({
      scenarioId: "gpu-node-unresponsive", timestamp: "2026-09-21T11:00:00.000Z", totalSteps: 4, completedSteps: 4, steps: [], overallTermHitRate: 85,
    });
    await mutations["forgeDiagnosisHistory:add"]({ scenarioId: "diag-001", difficulty: "learning", score: 88, stepsCompleted: 3, totalSteps: 3, xpEarned: 20 });
    await mutations["forgeQuickDrawHistory:add"]({ moduleId: "permissions", score: 94, totalItems: 10, correctItems: 9, timeMs: 30000, xpEarned: 20 });
    await mutations["forgeTicketHistory:add"]({ ...ticket(1), score: 92 });
    await mutations["forgeBounties:completeBounty"]({ bountyId: "bounty-qd-permissions", score: 100, xpEarned: 40 });
    const { awarded } = await mutations["forgeProfile:checkAndAwardBadges"]({});
    expect(awarded).toContain("first-forge");

    const rows = recent();
    expect(rows.find((r) => r.kind === "session_completed")).toMatchObject({ ref: "daily-training", value: 3, at: "2026-09-20T10:20:00.000Z" });
    expect(rows.find((r) => r.kind === "speed_run")).toMatchObject({ ref: "linux", value: 420, at: "2026-09-21T10:00:00.000Z" });
    expect(rows.find((r) => r.kind === "drill_completed")).toMatchObject({ ref: "gpu-node-unresponsive", value: 85 });
    expect(rows.find((r) => r.kind === "diagnosis_solved")).toMatchObject({ ref: "diag-001", value: 88 });
    expect(rows.find((r) => r.kind === "quick_draw")).toMatchObject({ ref: "permissions", value: 94 });
    expect(rows.find((r) => r.kind === "ticket_resolved")).toMatchObject({ ref: "orientation", value: 92 });
    expect(rows.find((r) => r.kind === "bounty_completed")).toMatchObject({ ref: "bounty-qd-permissions" });
    expect(rows.find((r) => r.kind === "bounty_completed")).not.toHaveProperty("value");
    expect(rows.filter((r) => r.kind === "badge_earned").map((r) => r.ref).sort()).toEqual([...awarded].sort());
  });

  it("holds ids and numbers only — never text anyone typed", async () => {
    const { mutations, recent } = await load();
    await mutations["forgeTicketHistory:add"]({ ...ticket(1), answer: "rm -rf / # <script>", commandsUsed: ["sudo su"] });
    await mutations["forgeSessions:add"]({ type: "daily-training", startTime: "2026-09-20T10:00:00.000Z", cardIds: ["a"], answers: [{ transcript: "my story" }] });

    for (const row of recent()) {
      expect(Object.keys(row).sort()).toEqual(["_creationTime", "_id", "at", "kind", "ref", "value"]);
      expect(typeof row.ref).toBe("string");
      expect(typeof row.value).toBe("number");
    }
    expect(JSON.stringify(recent())).not.toMatch(/script|sudo|story/);
  });

  it("logs joining the fleet, and awards the badge for it exactly once", async () => {
    const { mutations, recent, getState } = await load();
    const events: string[] = [];
    const onEvent = (e: Event) => events.push(String((e as CustomEvent).detail?.meta?.badge));
    window.addEventListener("mascot-trigger", onEvent);
    await mutations["forgeActivity:joinedFleet"]({});
    await expect(mutations["forgeProfile:awardBadge"]({ id: "enlisted" })).resolves.toEqual({ awarded: true });
    await expect(mutations["forgeProfile:awardBadge"]({ id: "enlisted" })).resolves.toEqual({ awarded: false });
    window.removeEventListener("mascot-trigger", onEvent);

    expect(recent().map((r) => [r.kind, r.ref])).toEqual([["badge_earned", "enlisted"], ["joined_fleet", ""]]);
    expect(getState().forgeProfile[0].badges).toEqual(["enlisted"]);
    expect(events).toEqual(["enlisted"]); // celebrated once, by the mutation
  });

  it("celebrates every badge checkAndAwardBadges hands out, from the mutation itself", async () => {
    const { mutations } = await load();
    const events: string[] = [];
    const onEvent = (e: Event) => events.push(String((e as CustomEvent).detail?.meta?.badge));
    window.addEventListener("mascot-trigger", onEvent);
    await mutations["forgeSessions:add"]({ type: "daily-training", startTime: "2026-09-20T10:00:00.000Z", cardIds: ["a"], answers: [] });
    const { awarded } = await mutations["forgeProfile:checkAndAwardBadges"]({});
    window.removeEventListener("mascot-trigger", onEvent);
    expect(awarded.length).toBeGreaterThan(0);
    expect(events.sort()).toEqual([...awarded].sort());
  });

  it("keeps the newest 200 rows, newest first", async () => {
    const { mutations, recent } = await load();
    for (let i = 0; i < 205; i++) await mutations["forgeTicketHistory:add"](ticket(i));

    const rows = recent(1000);
    expect(rows).toHaveLength(200);
    expect(rows[0].value).toBe(204);
    expect(rows.map((r) => r.value)).not.toContain(0);
    expect(recent(3)).toHaveLength(3);
  });
});
