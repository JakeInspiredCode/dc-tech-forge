#!/usr/bin/env node
// Renders the raster brand assets from SVG:
//
//   app/opengraph-image.png   1200x630  link previews (Slack, LinkedIn, iMessage…)
//   app/twitter-image.png     1200x630  same card for X/Twitter
//   app/apple-icon.png        180x180   iOS home-screen icon
//
// The PNGs are committed; re-run this only when the brand or the artwork
// changes:   node scripts/generate-brand-assets.mjs
//
// Text is set in system fonts because librsvg cannot load web fonts, so the
// output depends slightly on the machine it is rendered on.

import { readFile, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("This script needs sharp:  npm i -D sharp");
  process.exit(1);
}

const app = (file) => fileURLToPath(new URL(`../app/${file}`, import.meta.url));

// Same palette as app/globals.css.
const C = { bg: "#050508", panel: "#0a1a1f", cyan: "#06d6d6", amber: "#fbbf24", text: "#e0e4ec", dim: "#9fb4d0" };

// The galaxy map's sectors, in roughly their on-screen arrangement.
const SECTORS = [
  { x: 905, y: 330, r: 13, c: "#06d6d6" }, // Linux, the hub
  { x: 875, y: 150, r: 8, c: "#d946ef" },
  { x: 1030, y: 215, r: 9, c: "#818cf8" },
  { x: 1105, y: 360, r: 8, c: "#f43f5e" },
  { x: 1060, y: 490, r: 8, c: "#c026d3" },
  { x: 930, y: 520, r: 8, c: "#22c55e" },
  { x: 760, y: 470, r: 8, c: "#ef4444" },
  { x: 790, y: 205, r: 9, c: "#f59e0b" },
];
const LINKS = [[0, 1], [0, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 0], [4, 5]];

// Deterministic starfield (no Math.random, so re-renders are stable).
const stars = Array.from({ length: 140 }, (_, i) => {
  const x = (i * 7919) % 1200;
  const y = (i * 104729) % 630;
  const o = 0.15 + ((i * 31) % 60) / 100;
  return `<circle cx="${x}" cy="${y}" r="${i % 9 === 0 ? 1.6 : 0.9}" fill="#ffffff" opacity="${o.toFixed(2)}"/>`;
}).join("");

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="76%" cy="52%" r="45%">
      <stop offset="0" stop-color="${C.cyan}" stop-opacity=".16"/>
      <stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <rect width="1200" height="630" fill="${C.bg}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  ${stars}

  ${LINKS.map(([a, b]) => `<line x1="${SECTORS[a].x}" y1="${SECTORS[a].y}" x2="${SECTORS[b].x}" y2="${SECTORS[b].y}" stroke="${C.cyan}" stroke-opacity=".28" stroke-width="1.5"/>`).join("")}
  ${SECTORS.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r * 2.4}" fill="${s.c}" opacity=".35" filter="url(#blur)"/><circle cx="${s.x}" cy="${s.y}" r="${s.r * 2.1}" fill="none" stroke="${s.c}" stroke-opacity=".45"/><circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${s.c}"/>`).join("")}

  <g transform="translate(80 92) scale(1.25)">
    <path d="M32 6 54.5 19v26L32 58 9.5 45V19Z" fill="${C.panel}" stroke="${C.cyan}" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="20" y="22" width="24" height="5" rx="1.5" fill="${C.cyan}"/>
    <rect x="20" y="30" width="24" height="5" rx="1.5" fill="${C.cyan}" opacity=".75"/>
    <rect x="20" y="38" width="24" height="5" rx="1.5" fill="${C.cyan}" opacity=".5"/>
    <circle cx="40" cy="24.5" r="1.6" fill="${C.amber}"/>
  </g>

  <text x="80" y="292" font-family="Menlo, 'DejaVu Sans Mono', 'Courier New', monospace" font-weight="700" font-size="74" letter-spacing="3" fill="${C.cyan}">DC-TECH-FORGE</text>
  <text x="82" y="356" font-family="Helvetica, Arial, sans-serif" font-weight="600" font-size="35" fill="${C.text}">Train for the data center floor.</text>
  <text x="82" y="410" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="${C.dim}">Missions, drills, and a live ticket simulator.</text>

  <text x="82" y="540" font-family="Menlo, 'DejaVu Sans Mono', 'Courier New', monospace" font-size="19" letter-spacing="2" fill="${C.amber}">LINUX · NETWORKING · HARDWARE · POWER · FIBER · OPS</text>
</svg>`;

await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(app("opengraph-image.png"));
await copyFile(app("opengraph-image.png"), app("twitter-image.png"));

const icon = await readFile(app("icon.svg"));
await sharp(icon, { density: 300 }).resize(180, 180).png({ compressionLevel: 9 }).toFile(app("apple-icon.png"));

const alt = "DC-Tech-Forge — train for the data center floor. A star map of skill sectors: Linux, networking, hardware, power, fiber, and ops.";
await writeFile(app("opengraph-image.alt.txt"), alt + "\n");
await writeFile(app("twitter-image.alt.txt"), alt + "\n");

console.log("Wrote app/opengraph-image.png, app/twitter-image.png, app/apple-icon.png (+ alt text)");
