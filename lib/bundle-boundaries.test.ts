import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Two modules hold ALL of a kind of content: every quiz (≈490 KB of source) and
// every chapter lesson (≈690 KB). They exist for the server-rendered pages,
// static params and tests. If anything that runs in the browser can reach one,
// every visitor downloads all of it again — which is how opening one mission
// came to cost 136 KB of quizzes and one lesson 228 KB of chapters.
//
// This walks the real import graph from every "use client" module.

const ROOT = join(__dirname, "..");
const HEAVY = ["lib/seeds/knowledge-checks/index.ts", "lib/seeds/chapters/index.ts"];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null; // a package
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function importsOf(file: string): string[] {
  const src = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const specs = [
    ...src.matchAll(/\bfrom\s+["']([^"']+)["']/g), // import … from / export … from
    ...src.matchAll(/\bimport\s+["']([^"']+)["']/g), // side-effect import
    ...src.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g), // dynamic import: still a download
  ].map((m) => m[1]);
  // `import type` costs nothing at runtime
  const typeOnly = new Set([...src.matchAll(/\bimport\s+type\s+[^;]*?from\s+["']([^"']+)["']/g)].map((m) => m[1]));
  return specs.filter((s) => !typeOnly.has(s)).map((s) => resolveImport(file, s)).filter((f): f is string => f !== null);
}

const files = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components")), ...walk(join(ROOT, "lib"))];
const graph = new Map(files.map((f) => [f, importsOf(f)]));
const clientEntries = files.filter((f) => /^\s*["']use client["']/.test(readFileSync(f, "utf8")));

function pathTo(target: string): string[] | null {
  const queue: string[][] = clientEntries.map((f) => [f]);
  const seen = new Set(clientEntries);
  while (queue.length) {
    const trail = queue.shift()!;
    const here = trail[trail.length - 1];
    if (here === target) return trail;
    for (const next of graph.get(here) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push([...trail, next]);
    }
  }
  return null;
}

describe("bundle boundaries", () => {
  it("finds the app's client code (or the test below proves nothing)", () => {
    expect(clientEntries.length).toBeGreaterThan(50);
    for (const heavy of HEAVY) expect(existsSync(join(ROOT, heavy)), heavy).toBe(true);
  });

  it.each(HEAVY)("no browser code can reach %s", (heavy) => {
    const trail = pathTo(join(ROOT, heavy));
    // Load one mission's quiz / one sector's chapters through the load.ts beside it.
    expect(trail ? trail.map((f) => relative(ROOT, f)).join("  →  ") : null).toBeNull();
  });
});
