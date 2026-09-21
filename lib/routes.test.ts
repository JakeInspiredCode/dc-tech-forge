import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Two ways a page quietly stops existing for users, both of which happened:
//   - a redirect in vercel.json shadows it (/progress and Speed Run were live
//     pages that production had been redirecting away from), or
//   - nothing links to it any more (/train, /explore and four more).

const ROOT = join(__dirname, "..");
const APP = join(ROOT, "app");

function walk(dir: string, match: (name: string) => boolean, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, match, out);
    else if (match(name)) out.push(path);
  }
  return out;
}

const routeOf = (page: string) => {
  const rel = relative(APP, dirname(page)).split("\\").join("/");
  return rel === "" ? "/" : `/${rel}`;
};

const pages = walk(APP, (n) => n === "page.tsx");
const routes = pages.map(routeOf).sort();

const sources = ["app", "components", "lib"]
  .flatMap((top) => walk(join(ROOT, top), (n) => /\.tsx?$/.test(n) && !/\.test\./.test(n)))
  .map((file) => {
    let text = readFileSync(file, "utf8");
    // nav.tsx lists sub-routes only to decide which tab to highlight — not links.
    if (file.endsWith(join("components", "nav.tsx"))) text = text.replace(/const HUB_ROUTES[\s\S]*?\n};/, "");
    return { file: relative(ROOT, file).split("\\").join("/"), text };
  });

const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")) as {
  redirects: { source: string; destination: string }[];
};

describe("redirects", () => {
  it("never shadow a page that still exists", () => {
    const shadowed = vercel.redirects.map((r) => r.source).filter((source) => routes.includes(source));
    // Either delete the page or delete the redirect.
    expect(shadowed).toEqual([]);
  });

  it("all land on a real page", () => {
    const dead = vercel.redirects.filter((r) => !routes.includes(r.destination)).map((r) => `${r.source} -> ${r.destination}`);
    expect(dead).toEqual([]);
  });
});

describe("pages", () => {
  it("can all be reached from somewhere", () => {
    const orphans: string[] = [];
    for (const route of routes) {
      if (route === "/") continue;
      const ownDir = `app${route}/`;
      const dynamic = route.includes("[");
      // "/missions/[missionId]" is reached through `/missions/${id}`
      const needle = dynamic ? route.slice(0, route.indexOf("[")) : route;
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = dynamic ? new RegExp(`["'\`]${escaped}\\$\\{`) : new RegExp(`["'\`]${escaped}["'\`?#]`);
      const linked = sources.some((s) => !s.file.startsWith(ownDir) && pattern.test(s.text));
      if (!linked) orphans.push(route);
    }
    // Link it (Arsenal's ACTIVITIES is the usual place), or delete it and add a redirect.
    expect(orphans).toEqual([]);
  });

  it("all have a document title", () => {
    const untitled: string[] = [];
    for (const page of pages) {
      const route = routeOf(page);
      if (route === "/") continue; // the root layout's default title
      let titled = /generateMetadata|export const metadata/.test(readFileSync(page, "utf8"));
      for (let dir = dirname(page); !titled && dir !== APP; dir = dirname(dir)) {
        const layout = join(dir, "layout.tsx");
        titled = existsSync(layout) && /\btitle\b/.test(readFileSync(layout, "utf8"));
      }
      if (!titled) untitled.push(route);
    }
    // Add a layout.tsx exporting `metadata.title` (client pages cannot export it).
    expect(untitled).toEqual([]);
  });
});
