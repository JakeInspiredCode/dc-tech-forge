import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Two mistakes that are easy to make and invisible with a mouse:
//   1. a form control nothing names (a placeholder is not a name), and
//   2. onClick on a <div> or <span>, which a keyboard can neither reach nor press.
// This reads the JSX source, so it is a tripwire, not a full audit.

const ROOT = join(__dirname, "..");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.tsx$/.test(name)) out.push(path);
  }
  return out;
}

interface Tag { name: string; text: string; line: number; index: number }

/** Opening tags, brace- and string-aware so `onClick={() => a > b}` does not end the tag early. */
function openingTags(src: string, names: RegExp): Tag[] {
  const tags: Tag[] = [];
  const re = /<([a-zA-Z][\w.]*)(?=[\s/>])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (!names.test(m[1])) continue;
    let i = m.index + m[0].length;
    let depth = 0;
    let quote: string | null = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) {
        if (c === quote && src[i - 1] !== "\\") quote = null;
        continue;
      }
      // comments inside a tag's braces or attribute list
      if (c === "/" && src[i + 1] === "/") { i = src.indexOf("\n", i); if (i < 0) break; continue; }
      if (c === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i) + 1; if (i <= 0) break; continue; }
      if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    tags.push({ name: m[1], text: src.slice(m.index, i + 1), line: src.slice(0, m.index).split("\n").length, index: m.index });
  }
  return tags;
}

const FILES = [...sourceFiles(join(ROOT, "app")), ...sourceFiles(join(ROOT, "components"))];

describe("form controls", () => {
  it("all have an accessible name", () => {
    const unnamed: string[] = [];
    for (const file of FILES) {
      const src = readFileSync(file, "utf8");
      for (const tag of openingTags(src, /^(input|select|textarea)$/)) {
        if (/\baria-label(ledby)?=/.test(tag.text) || /type="hidden"/.test(tag.text)) continue;
        if (/\bid=/.test(tag.text) && /htmlFor=/.test(src)) continue; // <label htmlFor> pairing
        const before = src.slice(Math.max(0, tag.index - 500), tag.index);
        if (before.lastIndexOf("<label") > before.lastIndexOf("</label>")) continue; // wrapped in <label>
        unnamed.push(`${relative(ROOT, file)}:${tag.line} <${tag.name}>`);
      }
    }
    // Add aria-label="…" (or a <label>). A placeholder is not a name.
    expect(unnamed).toEqual([]);
  });
});

describe("click targets", () => {
  // A mouse convenience that duplicates a control a keyboard can already reach.
  const ALLOWED = new Set([
    "components/terminal-sim.tsx", // clicking anywhere in the terminal focuses its input
    "components/flashcard.tsx", // Space / Enter flip the card through a window key handler, and the card says so
  ]);

  it("are never a bare <div>/<span>/<g> with onClick", () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const rel = relative(ROOT, file);
      if (ALLOWED.has(rel)) continue;
      const src = readFileSync(file, "utf8");
      for (const tag of openingTags(src, /^(div|span|li|tr|td|p|section|article|g|img|label|h[1-6])$/)) {
        if (!/\bonClick=/.test(tag.text)) continue;
        if (/onClick=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/.test(tag.text)) continue; // swallowing clicks, not a control
        const operable = /\brole=/.test(tag.text) && /\btabIndex=/.test(tag.text) && /\bonKeyDown=/.test(tag.text);
        // An accordion card may keep a whole-card onClick for the mouse as long as
        // a keyboard-operable header sits inside it (see lib/a11y.ts).
        const after = src.slice(tag.index + tag.text.length, tag.index + tag.text.length + 700);
        const hasOperableHeader = /role="button"[\s\S]{0,200}onKeyDown=\{onActivate/.test(after);
        if (!operable && !hasOperableHeader) offenders.push(`${rel}:${tag.line} <${tag.name}>`);
      }
    }
    // Use a <button>, or role + tabIndex + onKeyDown={onActivate(...)}.
    expect(offenders).toEqual([]);
  });
});

describe("openingTags", () => {
  it("is not fooled by `>` inside an arrow function or a comment inside the tag", () => {
    const src = `<div
      // it's sticky
      onClick={() => (a > b ? go() : stop())}
      className="x"
    >hi</div>`;
    const [tag] = openingTags(src, /^div$/);
    expect(tag.text.endsWith(`className="x"\n    >`)).toBe(true);
  });
});
