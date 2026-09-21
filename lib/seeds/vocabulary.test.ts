import { describe, expect, it } from "vitest";
import { TOPICS } from "@/lib/types";
import { ALL_CAMPAIGNS } from "./campaigns";
import { ALL_SECTORS } from "./sectors";

// Each domain used to have four names: a sector ("Hardware Systems"), a Greek
// code ("Sector Theta"), a campaign codename ("Operation Rack & Stack") and a
// flashcard topic ("Server Hardware"). A learner had to work out that they were
// the same thing. The rule now: the sector's name is THE name, its campaign
// shares it, and a codename is flavour that only ever appears as a subtitle.

describe("one name per domain", () => {
  it("gives every sector exactly one campaign, carrying the same name", () => {
    for (const sector of ALL_SECTORS) {
      expect(sector.campaignIds, sector.id).toHaveLength(1);
      const campaign = ALL_CAMPAIGNS.find((c) => c.id === sector.campaignIds[0]);
      expect(campaign, `campaign for ${sector.id}`).toBeDefined();
      expect(campaign!.title, `${sector.id} vs ${campaign!.id}`).toBe(sector.title);
    }
  });

  it("keeps codenames out of the primary label", () => {
    for (const campaign of ALL_CAMPAIGNS) {
      expect(campaign.title, campaign.id).not.toMatch(/^Operation\b/);
      if (campaign.codename) expect(campaign.codename, campaign.id).not.toBe(campaign.title);
    }
  });

  // Flashcard topics are the same domains again (Profile mastery, Study,
  // the readiness radar). A topic is named after its sector; where a topic
  // spans two sectors (linux), it takes the first — the primary — one's name.
  it("names each flashcard topic after its sector", () => {
    for (const topic of TOPICS) {
      const sectors = ALL_SECTORS.filter((s) => s.topicId === topic.id);
      if (sectors.length === 0) continue; // e.g. behavioral: interview prep, no sector
      expect(topic.name, topic.id).toBe(sectors[0].title);
    }
  });

  it("leaves only topics that genuinely have no sector un-matched", () => {
    const orphans = TOPICS.filter((t) => !ALL_SECTORS.some((s) => s.topicId === t.id)).map((t) => t.id);
    expect(orphans).toEqual(["behavioral"]);
  });

  it("has no two sectors or campaigns sharing a name", () => {
    const titles = ALL_SECTORS.map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("topicName", () => {
  it("turns an id into the name a person sees, and leaves an unknown id alone", async () => {
    const { topicName } = await import("@/lib/types");
    expect(topicName("ops-processes")).toBe("Operations");
    expect(topicName("linux")).toBe("Linux Operations");
    expect(topicName("not-a-topic")).toBe("not-a-topic");
  });
});
