import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

async function load(cloud: boolean) {
  vi.resetModules();
  if (cloud) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  } else {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  return (await import("./fleet-band")).default;
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

describe("FleetBand", () => {
  it("is just the Fleet Log when there is no cloud", async () => {
    const FleetBand = await load(false);
    const html = renderToStaticMarkup(<FleetBand dense max={8} />);
    expect(html).toContain("Fleet Log");
    expect(html).not.toContain("Top pilots");
    expect(html).not.toContain("<button");
  });

  it("offers Top pilots as a second tab when there is, with the Fleet Log pressed first", async () => {
    const FleetBand = await load(true);
    const html = renderToStaticMarkup(<FleetBand dense max={8} />);
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Fleet Log<\/button>/);
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Top pilots<\/button>/);
    expect(html).toContain("recent activity");
    expect(html).toContain("Nothing logged yet"); // the log (empty before the store is live) renders by default, not the board
    expect(html).not.toContain("Top pilots this week");
  });
});
