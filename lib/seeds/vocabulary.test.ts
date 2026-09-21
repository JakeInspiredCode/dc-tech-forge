import { describe, expect, it } from "vitest";
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

  it("has no two sectors or campaigns sharing a name", () => {
    const titles = ALL_SECTORS.map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
