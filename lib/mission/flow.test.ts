import { describe, expect, it } from "vitest";
import { campaignHref, isOpenEnded, nextMissionId, resumePoint } from "./flow";

const loadout = [{ id: "m01-s1" }, { id: "m01-s2" }, { id: "m01-s3" }];

describe("resumePoint", () => {
  it("starts a mission you have never opened from the top", () => {
    expect(resumePoint(loadout, null)).toEqual({ phase: "playing", stepIndex: 0 });
    expect(resumePoint(loadout, { status: "available", stepsCompleted: [] })).toEqual({
      phase: "playing",
      stepIndex: 0,
    });
  });

  it("resumes an in-progress mission at the first step you have not completed", () => {
    const saved = { status: "in-progress", stepsCompleted: ["m01-s1"] };
    expect(resumePoint(loadout, saved)).toEqual({ phase: "playing", stepIndex: 1 });
  });

  it("returns to a step you skipped rather than jumping past it", () => {
    const saved = { status: "in-progress", stepsCompleted: ["m01-s1", "m01-s3"] };
    expect(resumePoint(loadout, saved)).toEqual({ phase: "playing", stepIndex: 1 });
  });

  it("goes to the knowledge check once every step is done", () => {
    const saved = { status: "in-progress", stepsCompleted: ["m01-s1", "m01-s2", "m01-s3"] };
    expect(resumePoint(loadout, saved)).toEqual({ phase: "knowledge-check" });
  });

  it("replays an accomplished mission from the top, not from the quiz", () => {
    const saved = { status: "accomplished", stepsCompleted: ["m01-s1", "m01-s2", "m01-s3"] };
    expect(resumePoint(loadout, saved)).toEqual({ phase: "playing", stepIndex: 0 });
  });

  it("ignores completed steps that are not in this loadout", () => {
    const saved = { status: "in-progress", stepsCompleted: ["something-removed"] };
    expect(resumePoint(loadout, saved)).toEqual({ phase: "playing", stepIndex: 0 });
  });
});

describe("nextMissionId", () => {
  const ids = ["linux-m01", "linux-m02", "linux-m03"];

  it("returns the following mission", () => {
    expect(nextMissionId(ids, "linux-m01")).toBe("linux-m02");
  });

  it("returns null after the last mission, so the UI can mark the campaign complete", () => {
    expect(nextMissionId(ids, "linux-m03")).toBeNull();
  });

  it("returns null for a mission that is not in the campaign", () => {
    expect(nextMissionId(ids, "hw-m01")).toBeNull();
  });
});

describe("isOpenEnded", () => {
  it("is true only for activities with no finish line", () => {
    expect(isOpenEnded("boot-process")).toBe(true);
    expect(isOpenEnded("explorer")).toBe(true);
    expect(isOpenEnded("card-set")).toBe(false);
    expect(isOpenEnded("quick-draw-module")).toBe(false);
    expect(isOpenEnded("chapter-section")).toBe(false);
  });
});

describe("campaignHref", () => {
  it("links to the campaign map", () => {
    expect(campaignHref("linux-core")).toBe("/missions?campaign=linux-core");
  });
});
