// ═══════════════════════════════════════════════════════════════════════════════
// Forge v2 Design Tokens — JS mirror of CSS custom properties
// Use when you need token values in JS (SVG rendering, dynamic styles, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

export const V2 = {
  bg: {
    deep: "#050508",
    base: "#0a0b10",
    surface: "#0f1118",
    elevated: "#151822",
    overlay: "#1a1e2a",
  },
  cyan: {
    base: "#06d6d6",
    bright: "#22f5ee",
    dim: "#0a4a4a",
    glow: "rgba(6, 214, 214, 0.15)",
    glowStrong: "rgba(6, 214, 214, 0.3)",
  },
  amber: {
    base: "#f59e0b",
    bright: "#fbbf24",
    dim: "#4a3a0a",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  green: {
    base: "#22c55e",
    bright: "#4ade80",
    dim: "#0a4a1e",
    glow: "rgba(34, 197, 94, 0.15)",
  },
  purple: {
    base: "#a855f7",
    bright: "#c084fc",
    dim: "#2e1065",
    glow: "rgba(168, 85, 247, 0.15)",
  },
  silver: {
    base: "#e0e4ec",
    bright: "#f1f3f8",
    dim: "#3a3d47",
    glow: "rgba(224, 228, 236, 0.1)",
  },
  blue: {
    base: "#2563eb",
    dim: "#1e3a5f",
  },
  status: {
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    purple: "#a855f7",
  },
  territory: {
    claimed: "#06d6d6",
    decaying: "#f59e0b",
    hostile: "#ef4444",
    locked: "#333344",
  },
  // No gray on dark: `muted` is the dimmest text the app uses, and it still
  // clears 6.6:1 on every surface. Kept equal to globals.css by contrast.test.ts.
  text: {
    base: "#e0e4ec",
    dim: "#b4c2d8",
    muted: "#93a5c1",
    glow: "#ffffff",
  },
  border: {
    base: "#1e2233",
    glow: "rgba(6, 214, 214, 0.3)",
  },
} as const;

// Room accent lookup
export const ROOM_COLORS = {
  "galaxy-map": V2.cyan,
  missions: V2.amber,
  arsenal: V2.green,
  comms: V2.purple,
  profile: V2.silver,
} as const;

// Mission node state → visual mapping
export const MISSION_NODE_COLORS = {
  locked: { fill: V2.territory.locked, stroke: V2.territory.locked, glow: "none" },
  available: { fill: V2.bg.surface, stroke: V2.cyan.base, glow: V2.cyan.glow },
  "in-progress": { fill: V2.cyan.dim, stroke: V2.cyan.base, glow: V2.cyan.glowStrong },
  accomplished: { fill: V2.cyan.dim, stroke: V2.cyan.bright, glow: V2.cyan.glowStrong },
  decaying: { fill: V2.bg.surface, stroke: V2.status.warning, glow: "rgba(245, 158, 11, 0.2)" },
} as const;
