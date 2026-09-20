import { describe, expect, it } from "vitest";
import { GAP, MARGIN, inflate, placeCard, type Rect, type Size } from "./placement";

const desktop: Size = { width: 1280, height: 800 };
const phone: Size = { width: 375, height: 812 };
const card: Size = { width: 360, height: 220 };

// The card must always be fully on screen, whatever else happens.
function expectOnScreen(p: { left: number; top: number }, c: Size, v: Size) {
  expect(p.left).toBeGreaterThanOrEqual(MARGIN);
  expect(p.top).toBeGreaterThanOrEqual(MARGIN);
  expect(p.left + c.width).toBeLessThanOrEqual(v.width - MARGIN);
  expect(p.top + c.height).toBeLessThanOrEqual(v.height - MARGIN);
}

describe("placeCard", () => {
  it("centers when there is nothing to point at", () => {
    const p = placeCard(null, card, desktop);
    expect(p).toEqual({ left: 460, top: 290, side: "center" });
  });

  it("sits to the right of a target on the left of a wide screen (a star on the map)", () => {
    const star: Rect = { x: 200, y: 350, width: 150, height: 140 };
    const p = placeCard(star, card, desktop);
    expect(p.side).toBe("right");
    expect(p.left).toBe(star.x + star.width + GAP);
    expectOnScreen(p, card, desktop);
  });

  it("sits to the left of a target pinned to the right edge (the side panel)", () => {
    const panel: Rect = { x: 930, y: 100, width: 340, height: 680 };
    const p = placeCard(panel, card, desktop);
    expect(p.side).toBe("left");
    expect(p.left + card.width).toBe(panel.x - GAP);
    expectOnScreen(p, card, desktop);
  });

  it("drops below a full-width strip at the top (the nav)", () => {
    const nav: Rect = { x: 0, y: 0, width: 1280, height: 56 };
    const p = placeCard(nav, card, desktop);
    expect(p.side).toBe("below");
    expect(p.top).toBe(56 + GAP);
    expectOnScreen(p, card, desktop);
  });

  it("goes above a target at the bottom of a narrow screen", () => {
    const bottomPanel: Rect = { x: 12, y: 480, width: 351, height: 320 };
    const small: Size = { width: 351, height: 200 };
    const p = placeCard(bottomPanel, small, phone);
    expect(p.side).toBe("above");
    expectOnScreen(p, small, phone);
  });

  it("stays on screen even when the target leaves no clear side", () => {
    const huge: Rect = { x: 0, y: 60, width: 375, height: 700 };
    const small: Size = { width: 351, height: 200 };
    expectOnScreen(placeCard(huge, small, phone), small, phone);
  });

  it("keeps the card on screen when the target is near a corner", () => {
    const corner: Rect = { x: 20, y: 20, width: 60, height: 60 };
    expectOnScreen(placeCard(corner, card, desktop), card, desktop);
  });
});

describe("inflate", () => {
  it("grows a rect evenly", () => {
    expect(inflate({ x: 10, y: 20, width: 100, height: 50 }, 8)).toEqual({ x: 2, y: 12, width: 116, height: 66 });
  });
});
