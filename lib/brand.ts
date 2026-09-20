// Single source of truth for the product name. Reference BRAND from
// components and metadata instead of hard-coding the name, so a future
// rename is a one-file change.

export const BRAND = {
  name: "DC-Tech-Forge",
  /** Nav wordmark (the display face is set in caps). */
  wordmark: "DC-TECH-FORGE",
  /** Compact mark for narrow screens, where the full wordmark won't fit. */
  shortMark: "DTF",
  /** File-name and package-name safe. */
  slug: "dc-tech-forge",
  description:
    "Train for a data center technician role — Linux, networking, hardware, and ops",
  /** Canonical production origin; absolute URLs in metadata resolve against it. */
  url: "https://forge.jakebuildsfunthings.com",
} as const;
