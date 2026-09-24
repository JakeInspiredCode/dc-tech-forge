import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BADGE_DEFS } from "@/lib/types";
import BadgeBanner, { BadgeCard } from "./badge-banner";

describe("the badge celebration", () => {
  it("is an empty live region until a badge is earned", () => {
    const html = renderToStaticMarkup(<BadgeBanner />);
    expect(html).toMatch(/<div role="status" aria-live="polite"[^>]*><\/div>/);
  });

  it("shows the badge: its icon, name and what it was for, and how many follow", () => {
    const html = renderToStaticMarkup(
      <BadgeCard badge={{ name: "Enlisted", condition: "Claim a callsign" }} icon="🎖️" more={2} leaving={false} reducedMotion={false} onDismiss={() => {}} />,
    );
    expect(html).toContain("Badge earned");
    expect(html).toContain("Enlisted");
    expect(html).toContain("Claim a callsign");
    expect(html).toContain("🎖️");
    expect(html).toContain("2 more are on the way");
    expect(html).toContain('class="badge-ring"');
    expect((html.match(/class="badge-spark"/g) ?? []).length).toBe(16);
    expect(html).toMatch(/<button type="button"[^>]*>Continue<\/button>/);
  });

  it("skips the ring and sparks under reduced motion, and animates out when leaving", () => {
    const html = renderToStaticMarkup(
      <BadgeCard badge={{ name: "Enlisted", condition: "Claim a callsign" }} icon="🎖️" more={0} leaving reducedMotion onDismiss={() => {}} />,
    );
    expect(html).not.toContain("badge-ring");
    expect(html).not.toContain("badge-spark");
    expect(html).toContain("is-leaving");
    expect(html).not.toContain("on the way");
  });

  it("has an icon for every badge, the new one included", () => {
    expect(BADGE_DEFS.find((b) => b.id === "enlisted")).toMatchObject({ name: "Enlisted", condition: "Claim a callsign" });
  });
});
