import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import TerminalSim from "./terminal-sim";

// Two bugs that shipped together on /terminal and were invisible in a DOM check:
// the box ignored its height (so S/M/L/XL and the drag handle did nothing), and
// every new line scrolled the whole PAGE, hiding the page title behind the nav.

describe("TerminalSim", () => {
  it("is as tall as it is told to be: a fixed height must not also be flex-1", () => {
    const html = renderToStaticMarkup(<TerminalSim height={240} />);
    const box = html.match(/<div[^>]*overflow-y-auto[^>]*>/)?.[0] ?? "";
    expect(box).toContain("height:240px");
    // flex-1 gives flex-basis 0, which beats `height` inside a column flexbox.
    expect(box).not.toMatch(/\bflex-1\b/);
  });

  it("still stretches when asked to fill its parent", () => {
    const html = renderToStaticMarkup(<TerminalSim fillHeight />);
    const box = html.match(/<div[^>]*overflow-y-auto[^>]*>/)?.[0] ?? "";
    expect(box).toMatch(/\bflex-1\b/);
    expect(box).not.toContain("height:");
  });

  it("scrolls its own box, never the page", () => {
    const src = readFileSync(join(__dirname, "terminal-sim.tsx"), "utf8").replace(/\/\/[^\n]*/g, "");
    expect(src).not.toContain("scrollIntoView");
    expect(src).toMatch(/scrollTop\s*=\s*\w+\.scrollHeight/);
  });
});
