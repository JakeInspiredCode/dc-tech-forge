import { beforeEach, describe, expect, it, vi } from "vitest";
import { BADGE_DEFS, TOPICS } from "@/lib/types";
import { ALL_MISSIONS, getMissionsForCampaign } from "@/lib/seeds/campaigns";
import { getAllModules } from "@/lib/seeds/quick-draw-modules";
import { getScenarioById } from "@/lib/seeds/diagnosis-scenarios";
import { STORAGE_KEYS } from "@/lib/storage-keys";

// The store is a module-level singleton, so every test gets a fresh one.
async function load() {
  vi.resetModules();
  const sample = await import("./sample-data");
  const store = await import("./store");
  const { seedIfEmpty } = await import("./seed");
  const { mutations } = await import("./operations");
  seedIfEmpty();
  return { ...sample, ...store, mutations };
}

beforeEach(() => {
  localStorage.clear();
});

describe("loadSampleData", () => {
  it("fills a fresh account and flags it as sample data", async () => {
    const { loadSampleData, isSampleDataLoaded, hasUserActivity } = await load();
    expect(hasUserActivity()).toBe(false);

    await expect(loadSampleData()).resolves.toBe(true);

    expect(hasUserActivity()).toBe(true);
    expect(isSampleDataLoaded()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.sampleData)).toBe("1");
  });

  // The sample used to hard-code ids ("lx-m01", "step-1", "net-packet-loss")
  // that matched nothing in the real content, so screens disagreed with each
  // other. These fail the moment an id drifts again.
  describe("only references content that exists", () => {
    it("missions and their steps", async () => {
      const { loadSampleData, getState } = await load();
      await loadSampleData();

      const touched = getState().forgeMissionProgress.filter((m) => m.status !== "available");
      expect(touched.length).toBeGreaterThan(0);
      for (const row of touched) {
        const mission = ALL_MISSIONS.find((m) => m.id === row.missionId);
        expect(mission, `mission ${row.missionId}`).toBeDefined();
        const realSteps = mission!.defaultLoadout.map((s) => s.id);
        expect(realSteps).toEqual(expect.arrayContaining(row.stepsCompleted));
      }
      for (const campaign of getState().forgeCampaignProgress) {
        for (const id of campaign.completedMissions) {
          expect(ALL_MISSIONS.some((m) => m.id === id), `mission ${id}`).toBe(true);
        }
      }
    });

    it("quick-draw modules, diagnosis scenarios, cards and badges", async () => {
      const { loadSampleData, getState } = await load();
      await loadSampleData();
      const state = getState();

      const moduleIds = new Set(getAllModules().map((m) => m.id));
      for (const row of state.forgeQuickDrawHistory) expect(moduleIds).toContain(row.moduleId);

      for (const row of state.forgeDiagnosisHistory) {
        const scenario = getScenarioById(row.scenarioId);
        expect(scenario, `scenario ${row.scenarioId}`).toBeDefined();
        expect(row.difficulty).toBe(scenario!.difficulty);
        expect(row.totalSteps).toBe(scenario!.steps.length);
      }

      const cardIds = new Set(state.forgeCards.map((c) => c.cardId));
      for (const review of state.forgeReviews) expect(cardIds).toContain(review.cardId);

      const badgeIds = new Set<string>(BADGE_DEFS.map((b) => b.id));
      for (const badge of state.forgeProfile[0].badges) expect(badgeIds).toContain(badge);
    });

    it("the Fleet Log: every row describes, and none is dated in the future", async () => {
      const { loadSampleData, getState } = await load();
      await loadSampleData();
      const { describeActivity } = await import("@/lib/activity/describe");
      const { loadNames, LAZY_NAME_KINDS } = await import("@/lib/activity/names");
      const names = Object.fromEntries(await Promise.all(LAZY_NAME_KINDS.map(async (k) => [k, await loadNames(k)])));

      const rows = getState().forgeActivity;
      expect(rows.length).toBeGreaterThan(10);
      for (const row of rows) {
        expect(describeActivity(row, names), `${row.kind} ${row.ref}`).not.toBeNull();
        expect(Date.parse(row.at), `${row.kind} ${row.ref}`).toBeLessThanOrEqual(Date.now());
      }
      expect(new Set(rows.map((r) => r.kind))).toEqual(
        new Set(["mission_accomplished", "diagnosis_solved", "quick_draw", "session_completed", "badge_earned"]),
      );
    });
  });

  describe("agrees with what the app computes", () => {
    it("lands each topic near its target mastery", async () => {
      const { loadSampleData, getState, SAMPLE_MASTERY } = await load();
      await loadSampleData();

      for (const topic of TOPICS) {
        const row = getState().forgeProgress.find((p) => p.topicId === topic.id);
        expect(row, `progress row for ${topic.id}`).toBeDefined();
        const target = SAMPLE_MASTERY[topic.id] ?? 0;
        expect(Math.abs(row!.masteryPercent - target), topic.id).toBeLessThanOrEqual(3);
      }
    });

    it("survives a recompute unchanged (the home page runs one on every first visit)", async () => {
      const { loadSampleData, getState, mutations } = await load();
      await loadSampleData();
      const strip = () =>
        getState().forgeProgress.map(({ topicId, masteryPercent, currentTier, masteredCards }) => ({
          topicId,
          masteryPercent,
          currentTier,
          masteredCards,
        }));
      const before = strip();

      for (const topic of TOPICS) {
        await mutations["forgeProgressRecompute:recompute"]({ topicId: topic.id });
      }

      expect(strip()).toEqual(before);
    });

    it("shows the same mission progress on the galaxy map and the campaign map", async () => {
      const { loadSampleData, getState, SAMPLE_CAMPAIGNS } = await load();
      await loadSampleData();
      const state = getState();

      for (const { campaignId, accomplished } of SAMPLE_CAMPAIGNS) {
        const campaign = state.forgeCampaignProgress.find((c) => c.campaignId === campaignId)!;
        const missionIds = getMissionsForCampaign(campaignId).map((m) => m.id);
        const accomplishedRows = state.forgeMissionProgress.filter(
          (m) => missionIds.includes(m.missionId) && m.status === "accomplished",
        );

        expect(campaign.completedMissions).toHaveLength(accomplished);
        expect(accomplishedRows.map((m) => m.missionId)).toEqual(campaign.completedMissions);
        expect(campaign.currentMissionIndex).toBe(accomplished);
      }
    });

    it("leaves some cards due, so the study queue is not empty", async () => {
      const { loadSampleData, getState } = await load();
      await loadSampleData();
      const today = new Date().toISOString().split("T")[0];

      const due = getState().forgeCards.filter((c) => c.repetitions > 0 && c.dueDate <= today);
      expect(due.length).toBeGreaterThan(0);
    });
  });

  it("contains no first-person stories or interview transcripts", async () => {
    const { loadSampleData, getState } = await load();
    await loadSampleData();

    expect(getState().forgeStories).toEqual([]);
    for (const session of getState().forgeSessions) {
      expect(session.type).not.toBe("mock-interview");
      expect(session.answers).toEqual([]);
    }
  });

  describe("real progress", () => {
    async function withRealReview() {
      const ctx = await load();
      await ctx.mutations["forgeReviews:add"]({
        cardId: ctx.getState().forgeCards[0].cardId,
        timestamp: new Date().toISOString(),
        quality: 4,
        responseTime: 1000,
      });
      return ctx;
    }

    it("is never overwritten by default", async () => {
      const { loadSampleData, getState, isSampleDataLoaded } = await withRealReview();

      await expect(loadSampleData()).resolves.toBe(false);

      expect(getState().forgeReviews).toHaveLength(1);
      expect(isSampleDataLoaded()).toBe(false);
    });

    it("is replaced only when explicitly asked", async () => {
      const { loadSampleData, getState } = await withRealReview();

      await expect(loadSampleData({ replaceExisting: true })).resolves.toBe(true);

      expect(getState().forgeReviews.length).toBeGreaterThan(100);
      expect(getState().forgeStories).toEqual([]);
    });
  });
});
