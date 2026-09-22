import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ALL_MISSIONS } from "@/lib/seeds/campaigns";
import FleetLog, { ownEntries } from "./fleet-log";

const at = new Date().toISOString();

describe("FleetLog", () => {
  it("renders a sentence per row, the doer first, with the name highlighted", () => {
    const mission = ALL_MISSIONS[0];
    const html = renderToStaticMarkup(
      <FleetLog
        entries={[
          { id: "1", actor: null, kind: "mission_accomplished", ref: mission.id, value: 90, at },
          { id: "2", actor: "ada_l", kind: "badge_earned", ref: "cards-100", at },
        ]}
      />,
    );
    expect(html).toContain('<ol aria-label="Recent activity"');
    expect(html).toMatch(new RegExp(`You</span> .*accomplished .*${mission.title}.* — 90%`));
    expect(html).toMatch(/ada_l<\/span> .*earned the .*Centurion.* badge/);
    expect(html).toContain('<time dateTime="');
    expect(html).toContain("just now");
  });

  it("skips rows that name nothing shipped, and says so when nothing is left", () => {
    const html = renderToStaticMarkup(
      <FleetLog entries={[{ id: "1", actor: null, kind: "mission_accomplished", ref: "lx-m99", at }]} emptyText="Quiet out there." />,
    );
    expect(html).not.toContain("<ol");
    expect(html).toContain("Quiet out there.");
  });

  it("shows at most `max` rows that describe", () => {
    const entries = ALL_MISSIONS.slice(0, 5).map((m, i) => ({ id: String(i), actor: null, kind: "mission_accomplished" as const, ref: m.id, at }));
    const html = renderToStaticMarkup(<FleetLog entries={entries} max={2} />);
    expect(html.match(/<li/g)).toHaveLength(2);
  });

  it("turns store rows into entries about the person looking", () => {
    expect(ownEntries([{ _id: "x", _creationTime: 1, kind: "speed_run", ref: "linux", value: 3, at }])).toEqual([
      { id: "x", actor: null, kind: "speed_run", ref: "linux", value: 3, at },
    ]);
  });
});
