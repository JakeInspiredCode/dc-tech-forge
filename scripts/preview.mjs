#!/usr/bin/env node
// Serve the static export (out/) the way production does: with the redirects
// and response headers from vercel.json applied, and clean URLs.
//
// `next start` cannot serve a static export, and a generic file server would
// skip the Content-Security-Policy — which is exactly the thing worth testing
// locally before it ships. No dependencies on purpose.
//
//   npm run build && npm start        (PORT=4000 npm start to change the port)

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../out", import.meta.url)));
const PORT = Number(process.env.PORT ?? 3000);
const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// vercel.json sources are path-to-regexp patterns; the ones used here only
// need the "(.*)" wildcard, which is already a valid regular expression.
const toRegExp = (source) => new RegExp(`^${source}$`);
const headerRules = (config.headers ?? []).map((r) => ({ match: toRegExp(r.source), headers: r.headers }));
const redirects = (config.redirects ?? []).map((r) => ({ ...r, match: toRegExp(r.source) }));

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

// cleanUrls: /missions -> missions.html, / -> index.html
async function resolveFile(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.(\/|\\|$))+/, "");
  const base = join(ROOT, safe);
  if (base !== ROOT && !base.startsWith(ROOT + sep)) return null; // path traversal
  for (const candidate of [base, `${base}.html`, join(base, "index.html")]) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? "/", `http://${req.headers.host}`);

  for (const rule of headerRules) {
    if (rule.match.test(pathname)) for (const h of rule.headers) res.setHeader(h.key, h.value);
  }

  const redirect = redirects.find((r) => r.match.test(pathname));
  if (redirect) {
    res.writeHead(redirect.permanent ? 308 : 307, { Location: redirect.destination }).end();
    return;
  }

  const file = await resolveFile(pathname);
  if (file) {
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(await readFile(file));
    return;
  }

  const notFound = join(ROOT, "404.html");
  res.writeHead(404, { "Content-Type": TYPES[".html"] });
  res.end((await isFile(notFound)) ? await readFile(notFound) : "Not found");
});

if (!(await isFile(join(ROOT, "index.html")))) {
  console.error("No export found at out/. Run `npm run build` first.");
  process.exit(1);
}

server.listen(PORT, () => console.log(`Serving out/ with production headers at http://localhost:${PORT}`));
