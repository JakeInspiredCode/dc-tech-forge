import { beforeEach, describe, expect, it, vi } from "vitest";

async function load() {
  vi.resetModules();
  const { mutations } = await import("./operations");
  const { getState } = await import("./store");
  const { seedIfEmpty } = await import("./seed");
  seedIfEmpty();
  const status = (id: string) => getState().forgeMissionProgress.find((m) => m.missionId === id)?.status;
  return { mutations, getState, status };
}

const MISSION = "linux-m01";

beforeEach(() => {
  localStorage.clear();
});

describe("updateMissionStatus", () => {
  it("marks a fresh mission as in progress", async () => {
    const { mutations, status } = await load();
    await mutations["forgeMissions:updateMissionStatus"]({ missionId: MISSION, status: "in-progress" });
    expect(status(MISSION)).toBe("in-progress");
  });

  // The mission player sets "in-progress" every time a mission opens. Without
  // a guard, reopening a completed mission to review it un-completed it on the
  // map (4/12 became 3/12) until the quiz was passed again.
  it("never un-completes an accomplished mission", async () => {
    const { mutations, status } = await load();
    await mutations["forgeMissions:submitKnowledgeCheck"]({
      missionId: MISSION,
      score: 1,
      passed: true,
      xpEarned: 250,
    });
    expect(status(MISSION)).toBe("accomplished");

    await mutations["forgeMissions:updateMissionStatus"]({ missionId: MISSION, status: "in-progress" });

    expect(status(MISSION)).toBe("accomplished");
  });

  it("keeps an accomplished mission accomplished through a failed retake", async () => {
    const { mutations, status, getState } = await load();
    await mutations["forgeMissions:submitKnowledgeCheck"]({ missionId: MISSION, score: 1, passed: true, xpEarned: 250 });
    await mutations["forgeMissions:updateMissionStatus"]({ missionId: MISSION, status: "in-progress" });
    await mutations["forgeMissions:submitKnowledgeCheck"]({ missionId: MISSION, score: 0.2, passed: false, xpEarned: 0 });

    expect(status(MISSION)).toBe("accomplished");
    const row = getState().forgeMissionProgress.find((m) => m.missionId === MISSION)!;
    expect(row.knowledgeCheckPassed).toBe(true);
    expect(row.bestScore).toBe(1);
  });
});

describe("completeMissionStep", () => {
  it("records a step once, however many times it is reported", async () => {
    const { mutations, getState } = await load();
    await mutations["forgeMissions:completeMissionStep"]({ missionId: MISSION, stepId: "m01-s1" });
    await mutations["forgeMissions:completeMissionStep"]({ missionId: MISSION, stepId: "m01-s1" });

    const row = getState().forgeMissionProgress.find((m) => m.missionId === MISSION)!;
    expect(row.stepsCompleted).toEqual(["m01-s1"]);
  });
});
