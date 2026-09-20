import { describe, expect, it } from "vitest";
import { missionHref, nextUp, type CampaignOutline } from "./next-up";

const linux: CampaignOutline = {
  id: "linux-core",
  title: "Linux Operations",
  missions: [
    { id: "linux-m01", title: "What is Linux?" },
    { id: "linux-m02", title: "The Shell" },
    { id: "linux-m03", title: "Filesystem Hierarchy" },
  ],
};
const hardware: CampaignOutline = {
  id: "hardware-core",
  title: "Hardware Systems",
  missions: [
    { id: "hw-m01", title: "Server Anatomy" },
    { id: "hw-m02", title: "GPUs" },
  ],
};
const campaigns = [linux, hardware];

const statuses = (map: Record<string, string>) => (id: string) => map[id];

describe("nextUp", () => {
  it("sends a brand-new learner to the first mission of the curriculum", () => {
    expect(nextUp(campaigns, statuses({}))).toEqual({
      kind: "start",
      campaignId: "linux-core",
      campaignTitle: "Linux Operations",
      missionId: "linux-m01",
      missionTitle: "What is Linux?",
      missionNumber: 1,
    });
  });

  it("does not let merely browsing another campaign redirect a new learner", () => {
    const result = nextUp(campaigns, statuses({}), "hardware-core");
    expect(result).toMatchObject({ kind: "start", missionId: "linux-m01" });
  });

  it("continues the mission that is under way", () => {
    const result = nextUp(campaigns, statuses({ "linux-m01": "accomplished", "linux-m02": "in-progress" }));
    expect(result).toMatchObject({ kind: "continue", missionId: "linux-m02", missionNumber: 2 });
  });

  it("moves to the next unfinished mission when none is under way", () => {
    const result = nextUp(campaigns, statuses({ "linux-m01": "accomplished", "linux-m02": "accomplished" }));
    expect(result).toMatchObject({ kind: "continue", missionId: "linux-m03", missionNumber: 3 });
  });

  it("prefers the campaign the learner was last in, once they have progress there", () => {
    const status = statuses({ "linux-m01": "accomplished", "hw-m01": "accomplished" });
    expect(nextUp(campaigns, status, "hardware-core")).toMatchObject({ missionId: "hw-m02" });
    expect(nextUp(campaigns, status, "linux-core")).toMatchObject({ missionId: "linux-m02" });
  });

  it("prefers a campaign with a mission under way over one merely started", () => {
    const status = statuses({ "linux-m01": "accomplished", "hw-m01": "in-progress" });
    expect(nextUp(campaigns, status)).toMatchObject({ missionId: "hw-m01" });
  });

  it("skips a finished campaign, even if it was the last one visited", () => {
    const status = statuses({
      "linux-m01": "accomplished",
      "linux-m02": "accomplished",
      "linux-m03": "accomplished",
    });
    expect(nextUp(campaigns, status, "linux-core")).toMatchObject({
      kind: "continue",
      campaignId: "hardware-core",
      missionId: "hw-m01",
    });
  });

  it("says so when everything is done", () => {
    const all = Object.fromEntries([...linux.missions, ...hardware.missions].map((m) => [m.id, "accomplished"]));
    expect(nextUp(campaigns, statuses(all))).toEqual({ kind: "all-done" });
  });

  it("scopes to a single campaign when given only that one (the campaign map)", () => {
    const status = statuses({ "hw-m01": "accomplished", "linux-m01": "in-progress" });
    expect(nextUp([hardware], status)).toMatchObject({ campaignId: "hardware-core", missionId: "hw-m02" });
  });
});

describe("missionHref", () => {
  it("opens the mission straight into play, like clicking its planet", () => {
    expect(missionHref("linux-m05")).toBe("/missions/linux-m05?autostart=true");
  });
});
