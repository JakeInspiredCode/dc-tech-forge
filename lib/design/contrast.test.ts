import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, saturation } from "./contrast";
import { V2 } from "./forge-v2-tokens";

// The house rule is "no gray text on dark" (CLAUDE.md). These tests keep it
// true: the text tokens must clear WCAG AA on every surface, the TypeScript
// mirror must not drift from the CSS, and no component may hard-code a
// gray-family text colour again.

const ROOT = join(__dirname, "..", "..");
const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");

function cssToken(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`));
  if (!m) throw new Error(`token --${name} not found in globals.css`);
  return m[1].toLowerCase();
}

const SURFACES = ["color-v2-bg-deep", "color-v2-bg", "color-v2-bg-surface", "color-v2-bg-elevated", "color-v2-bg-overlay"];
const TEXT_TOKENS = ["color-v2-text", "color-v2-text-dim", "color-v2-text-muted"];

describe("text tokens", () => {
  it.each(TEXT_TOKENS)("--%s clears 4.5:1 on every surface", (token) => {
    for (const surface of SURFACES) {
      const ratio = contrastRatio(cssToken(token), cssToken(surface));
      expect(ratio, `${token} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps a visible hierarchy: text > dim > muted", () => {
    const bg = cssToken("color-v2-bg-elevated");
    const [text, dim, muted] = ["color-v2-text", "color-v2-text-dim", "color-v2-text-muted"].map((t) => contrastRatio(cssToken(t), bg));
    expect(text).toBeGreaterThan(dim + 1);
    expect(dim).toBeGreaterThan(muted + 1);
  });

  it("keeps the TypeScript mirror equal to the CSS", () => {
    expect(V2.text.base).toBe(cssToken("color-v2-text"));
    expect(V2.text.dim).toBe(cssToken("color-v2-text-dim"));
    expect(V2.text.muted).toBe(cssToken("color-v2-text-muted"));
    expect(V2.bg.deep).toBe(cssToken("color-v2-bg-deep"));
    expect(V2.bg.surface).toBe(cssToken("color-v2-bg-surface"));
    expect(V2.bg.elevated).toBe(cssToken("color-v2-bg-elevated"));
    expect(V2.bg.overlay).toBe(cssToken("color-v2-bg-overlay"));
  });
});

// ── No hard-coded gray text ────────────────────────────────────────────────

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

/** Hex literals used as a TEXT colour: `color: "#…"` (incl. ternaries) and `text-[#…]`. */
function textColours(line: string): string[] {
  const found: string[] = [];
  for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const before = line.slice(0, m.index);
    if (/text-\[$/.test(before)) {
      found.push(m[0]);
      continue;
    }
    // the property this literal belongs to = the last `name:` before it
    // (a ternary's `? color :` is not a property name)
    const props = [...before.matchAll(/(?<!\?\s*)\b([A-Za-z]+)\s*:(?!:)/g)];
    const owner = props.at(-1)?.[1];
    if (owner === "color" && /["'`]$/.test(before.trimEnd())) found.push(m[0]);
  }
  return found;
}

describe("no gray text on dark", () => {
  it("has no hard-coded gray-family text colour in app/ or components/", () => {
    const worstSurface = cssToken("color-v2-bg-overlay");
    const offenders: string[] = [];
    for (const file of [...sourceFiles(join(ROOT, "app")), ...sourceFiles(join(ROOT, "components"))]) {
      readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        for (const hex of textColours(line)) {
          const ratio = contrastRatio(hex, worstSurface);
          // Below 1.25 it is dark text meant for a bright button, not gray-on-dark.
          const isGrayOnDark = saturation(hex) <= 0.4 && ratio >= 1.25 && ratio < 4.5;
          if (isGrayOnDark) offenders.push(`${relative(ROOT, file)}:${i + 1}  ${hex}  ${ratio.toFixed(1)}:1`);
        }
      });
    }
    // Use var(--color-v2-text-muted) / text-v2-text-muted / V2.text.muted instead.
    expect(offenders).toEqual([]);
  });

  // There was a second, older palette ("forge-*": neutral grays and a blue
  // accent) used ~1,300 times across 34 files. It was ported to the v2 palette
  // and the tokens deleted; a class that names one now would silently render
  // with no colour at all.
  it("has no trace of the retired forge-* palette", () => {
    const offenders: string[] = [];
    const legacy = /\b(?:[a-z-]+:)*(?:bg|text|border|ring|from|to|via|shadow|divide|outline|fill|stroke|decoration|placeholder)-forge-[a-z]|--color-forge-/;
    for (const file of [...sourceFiles(join(ROOT, "app")), ...sourceFiles(join(ROOT, "components"))]) {
      readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        if (legacy.test(line)) offenders.push(`${relative(ROOT, file)}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
    expect(css).not.toMatch(/--color-forge-/);
  });

  // The accent, solid, is a bright fill: text on it must be dark. White on
  // cyan is 1.7:1, on green 2.3:1, on amber 2.1:1 (and was failing on the
  // last two long before the port).
  it("never puts white text on a solid accent or status fill", () => {
    const offenders: string[] = [];
    const solidFill = /\bbg-v2-(?:cyan|cyan-bright|green|success|amber|warning|danger)(?![\w/-])/;
    for (const file of [...sourceFiles(join(ROOT, "app")), ...sourceFiles(join(ROOT, "components"))]) {
      readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        if (solidFill.test(line) && /\btext-white\b(?!\/)/.test(line)) offenders.push(`${relative(ROOT, file)}:${i + 1}`);
      });
    }
    // Use text-v2-bg-deep.
    expect(offenders).toEqual([]);
  });

  it("recognises the patterns it is meant to catch", () => {
    expect(textColours(`<span style={{ color: "#556", fontSize: 10 }}>`)).toEqual(["#556"]);
    expect(textColours(`color: done ? "#22c55e" : "#667",`)).toEqual(["#22c55e", "#667"]);
    expect(textColours(`<span className="text-[11px] text-[#6a7288]">`)).toEqual(["#6a7288"]);
    expect(textColours(`background: "#333", borderColor: "#445"`)).toEqual([]);
    expect(textColours(`&#9662;`)).toEqual([]);
    expect(textColours(`stroke={isCompleted ? color : "#7a8298"}`)).toEqual([]);
  });
});
