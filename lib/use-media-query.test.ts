import { describe, expect, it } from "vitest";
import { COMPACT_LAYOUT_QUERY } from "./use-media-query";

describe("COMPACT_LAYOUT_QUERY", () => {
  // The tour picks its wording from this query while the maps pick their layout
  // from Tailwind's `lg` (1024px). If they drift, a 1000px window gets the list
  // layout with a tour that talks about stars.
  it("ends exactly where Tailwind's lg begins", () => {
    expect(COMPACT_LAYOUT_QUERY).toBe("(max-width: 1023px)");
  });
});
