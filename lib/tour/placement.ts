// Where to put the tour's text card relative to the thing it is pointing at.
// Pure geometry, kept apart from the component so it can be tested.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Side = "right" | "left" | "below" | "above" | "center";

export interface Placement {
  left: number;
  top: number;
  side: Side;
}

/** Space between the anchor and the card. */
export const GAP = 16;
/** Minimum distance from the card to the edge of the viewport. */
export const MARGIN = 12;

export function placeCard(anchor: Rect | null, card: Size, viewport: Size): Placement {
  const clampX = (x: number) => Math.max(MARGIN, Math.min(x, viewport.width - card.width - MARGIN));
  const clampY = (y: number) => Math.max(MARGIN, Math.min(y, viewport.height - card.height - MARGIN));

  if (!anchor) {
    return {
      left: clampX((viewport.width - card.width) / 2),
      top: clampY((viewport.height - card.height) / 2),
      side: "center",
    };
  }

  const room = {
    right: viewport.width - (anchor.x + anchor.width) - GAP - MARGIN,
    left: anchor.x - GAP - MARGIN,
    below: viewport.height - (anchor.y + anchor.height) - GAP - MARGIN,
    above: anchor.y - GAP - MARGIN,
  };
  const alongsideY = clampY(anchor.y + anchor.height / 2 - card.height / 2);
  const alongsideX = clampX(anchor.x + anchor.width / 2 - card.width / 2);

  // Beside the anchor where the layout is wide enough, otherwise above or below.
  if (room.right >= card.width) return { left: anchor.x + anchor.width + GAP, top: alongsideY, side: "right" };
  if (room.left >= card.width) return { left: anchor.x - GAP - card.width, top: alongsideY, side: "left" };
  if (room.below >= card.height) return { left: alongsideX, top: anchor.y + anchor.height + GAP, side: "below" };
  if (room.above >= card.height) return { left: alongsideX, top: anchor.y - GAP - card.height, side: "above" };

  // Nowhere is clear (a phone, usually). Take the roomier end of the screen and
  // accept that the card overlaps part of the anchor.
  return room.below >= room.above
    ? { left: alongsideX, top: clampY(viewport.height), side: "below" }
    : { left: alongsideX, top: MARGIN, side: "above" };
}

/** Grow a rect on every side, e.g. so a spotlight doesn't hug its target. */
export function inflate(rect: Rect, by: number): Rect {
  return { x: rect.x - by, y: rect.y - by, width: rect.width + by * 2, height: rect.height + by * 2 };
}
