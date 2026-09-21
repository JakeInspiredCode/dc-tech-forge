# Notes for Claude (LLM agents)

This file is loaded automatically into your context. The README is the canonical user-facing doc — read it when relevant. This file only covers things that aren't obvious from reading the code.

The product is **DC-Tech-Forge**. It used to be called L1NX, which is why the local folder, some git history, and the storage-key migration still say `l1nx`.

## Deployment: one target

- **`main` is the only branch that matters**, and **Vercel auto-deploys it to production on every push.** Treat a push to `main` as a production deploy. Do feature work on a branch and open a PR — Vercel builds a preview for each one.
- The build is a **static export** (`output: "export"` in [next.config.js](next.config.js)). The app has no API routes, server actions, or middleware, so there is no server runtime. Keep it that way unless a feature genuinely needs a server.
- Because of that, **redirects and response headers live in [vercel.json](vercel.json)**, not `next.config.js` — `redirects()` and `headers()` are not supported with static export.
- `npm start` serves `out/` with the redirects and headers from `vercel.json` applied ([scripts/preview.mjs](scripts/preview.mjs)). **Use it to test a Content-Security-Policy change** before it ships; `npm run dev` does not send those headers.
- There used to be a second target — a static demo copied into the personal-site repo and served at `jakebuildsfunthings.com/l1nx-forge/`, built by `scripts/deploy-demo.sh` with three `L1NX_*` env vars. **That pipeline is retired. Do not recreate it.** Sample data is now a runtime choice (below), so one deployment serves everyone.

## Before you call something done

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

CI runs the same steps plus `npm audit` on every PR. Lint has zero errors; the remaining warnings are tracked debt — don't add to them.

## Things that look weird but are intentional

- **Lesson content uses inline pixel font sizes.** `components/linux-foundations.tsx` and `components/chapter/*` set sizes in absolute px (e.g., `fontSize: 11`) instead of Tailwind utilities. This is on purpose — there's a per-lesson "Aa" size toggle ([`lib/use-lesson-scale.ts`](lib/use-lesson-scale.ts)) that scales the whole lesson via CSS transform. **Don't bump these to "fix" them** unless the user asks for lesson-content typography changes specifically.
- **The `[missionId]` and `[topicId]` routes are split** into a server component with `generateStaticParams` and a client component sibling. The static export needs this to prerender every page — don't collapse them back into a single client component.
- **Fonts come from `@fontsource`, not `next/font`.** The three families are referenced by their literal names in 100+ inline styles; `next/font` hashes family names and would silently break them. Self-hosting also keeps the CSP at `font-src 'self'`.
- **`package.json` overrides Next's pinned `postcss`.** Next 15 pins an old PostCSS with open advisories, and npm's only offered fix was a major bump to Next 16. The override's output was verified byte-identical. Remove it when moving to Next 16.
- **`docs/unused-assets/viewport-frame.png` is kept on purpose** (see its README). It lives outside `public/` because everything in `public/` gets deployed.
- **Chapter blocks have a field called `html`, but nothing renders HTML.** `Prose` tokenizes a tiny markdown subset into React text nodes (its prop is `text`; the data field kept its old name). The codebase has no `dangerouslySetInnerHTML` / `innerHTML` / `eval`, and the CSP leans on that. Keep it that way.

## Rules for the data layer

Progress lives only in the user's browser, so mistakes here destroy real data.

- **Every storage key is declared in [`lib/storage-keys.ts`](lib/storage-keys.ts).** Never write a key literal anywhere else, and **never rename a key without adding a migration** next to the existing L1NX one.
- **Derived data is derived.** Topic mastery, tier, and weak flags are recomputed from per-card SM-2 state (`forgeProgressRecompute:recompute`). Writing a `forgeProgress` row by hand is pointless — the next recompute overwrites it.
- **Sample data ([`lib/data/sample-data.ts`](lib/data/sample-data.ts)) takes every id from the real content** and lets the app compute what it computes. Tests fail if an id it references stops existing. It must **never include Story Bank answers or interview transcripts**: the app is linked from the author's résumé, where first-person stories read as his own claims.
- **Anything imported from a file is hostile** ([`lib/data/backup.ts`](lib/data/backup.ts), [`lib/import-export.ts`](lib/import-export.ts)). A bad record that reaches the store is re-hydrated on every visit and can crash a page permanently. Validate, whitelist fields, and test the malformed cases.
- The backup validator's field spec is typed from `schema.ts`, so adding a schema field is a compile error until the validator covers it. That is deliberate.

## Conventions

- The product name comes from [`lib/brand.ts`](lib/brand.ts). Don't hard-code it.
- **One name per domain.** A sector's `title` is THE name; its campaign shares it; a campaign `codename` ("Operation Rack & Stack") is flavour and only ever a subtitle. `lib/seeds/vocabulary.test.ts` enforces this. Themed names stay, but pair them with plain words (see the `hint`s in `components/nav.tsx`). The quiz is always a "Knowledge Check".
- **No gray text on dark backgrounds** — use white or blue-tinted text. (Large parts of the older UI still violate this; don't add more.)
- Full-height screens size themselves with `h-[calc(100vh-var(--chrome-h))]`, not a hard-coded nav height. `--chrome-h` grows when the sample-data banner is showing.
