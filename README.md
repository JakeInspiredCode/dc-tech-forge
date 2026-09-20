# DC-Tech-Forge

A training app for people preparing to work as data center technicians — Linux, networking, server hardware, power and cooling, fiber, and operations. It teaches through guided missions, spaced-repetition flashcards, timed drills, and a simulated terminal where you work real-looking tickets.

**Live:** https://forge.jakebuildsfunthings.com — add `?demo=1` to open it with sample progress already filled in.

It is a fully static, local-first web app: there is no backend and there are no accounts. Everything you do is saved in your own browser.

## What's in it

| Area | What it is |
|---|---|
| **Galaxy Map** | The home screen. Each star is a skill sector; pick one to open its campaign. |
| **Missions** | 44 missions across 8 campaigns. Each is a short lesson (with interactive blocks), hands-on practice, and a knowledge check you pass to complete it. |
| **Arsenal** | Practice on demand: flashcard review, Quick Draw recall rounds, the Diagnosis Lab, incident drills, a boot-process explorer, a filesystem navigator, a command dissector, and a Story Bank for interview prep. |
| **Battlestation** | A ticket simulator. Tickets arrive at six difficulty levels and you resolve them in a simulated terminal. |
| **Profile** | Topic mastery, badges, streaks, and settings — including backup, sample progress, and reset. |

### How learning is tracked

- **Spaced repetition.** 374 flashcards are scheduled with the SM-2 algorithm ([lib/sm2.ts](lib/sm2.ts)). You grade each answer 0–5; that sets the card's ease, interval, and next due date. Slow answers (over 15s) are graded down.
- **Tiers.** Cards run from basic recall (tier 1) to multi-step scenarios (tier 4). A topic's next tier opens once 70% of the current tier is qualified.
- **Mastery is derived, never stored by hand.** A topic's mastery, tier, and weak flag are recomputed from its cards' review state, so every screen agrees.

### Your data

- Progress lives in `localStorage` under `dctf:` keys, all declared in [lib/storage-keys.ts](lib/storage-keys.ts).
- **Settings → Your data** exports everything to a JSON file and imports it elsewhere. Browser storage is per-origin, so this is how you move progress between devices or browsers.
- Imported files are treated as untrusted: every record is rebuilt from a whitelist of known fields and type-checked, and a file is rejected whole if any part of it is invalid ([lib/data/backup.ts](lib/data/backup.ts)).
- **Sample progress** fills a fresh account with a few weeks of made-up activity so you can see the app in use. It is always labelled with a banner, and "Start fresh" clears it.

## Tech

| | |
|---|---|
| Framework | Next.js 15 (App Router), exported as static files |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript (strict) |
| Tests | Vitest + jsdom |
| Lint | ESLint 9 (`next/core-web-vitals`, `next/typescript`) |
| Backend | None |

## Getting started

Requires Node.js 22 (22.13 or newer) — the same major that CI and Vercel build with.

```bash
npm install
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server with hot reload. |
| `npm run build` | Static export to `out/`. |
| `npm start` | Serves `out/` **with the production redirects and security headers** from `vercel.json`. Use this to test the Content-Security-Policy locally. |
| `npm run typecheck` | Generates route types, then `tsc --noEmit`. |
| `npm run lint` | ESLint. |
| `npm test` | Unit tests. `npm run test:watch` to watch. |

CI runs a dependency audit, typecheck, lint, tests, and a build on every pull request ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Project structure

```
app/                     Routes (App Router)
  page.tsx               Galaxy Map + onboarding
  missions/              Campaign map; [missionId]/ is the mission player
  arsenal/               Practice library
  battle-station/        Ticket simulator
  profile/               Mastery, badges, settings
  study/ cards/ drill/ terminal/ stories/ train/ …   Individual Arsenal tools
components/              UI, grouped by feature (galaxy-map/, system-map/, mission/, chapter/, …)
lib/
  brand.ts               The product name — single source of truth
  storage-keys.ts        Every browser-storage key, plus the legacy-key migration
  sm2.ts                 Spaced-repetition scheduling
  data/                  The client-side data layer
    store.ts             In-memory state + subscriptions
    persistence.ts       Debounced localStorage persistence, reset
    operations.ts        Queries and mutations
    seed.ts              First-run content
    sample-data.ts       Sample progress (loaded on demand)
    backup.ts            Export / validated import
  seeds/                 Content: campaigns, missions, chapters, cards, drills, scenarios
scripts/
  preview.mjs            `npm start`
  generate-brand-assets.mjs   Renders the social-preview image and app icon
vercel.json              Redirects and security headers
```

## Security

The app has no API routes, server actions, or middleware, so it is deployed as static files — there is no server runtime to attack.

- **Headers** (in [vercel.json](vercel.json)): a Content-Security-Policy limited to same-origin resources, `frame-ancestors 'none'`, `nosniff`, a strict referrer policy, and a locked-down permissions policy. `script-src` allows `'unsafe-inline'` because a static Next.js export cannot use nonces; the primary defence is that the codebase contains no HTML-injection sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval`).
- **No third-party requests.** Fonts are self-hosted.
- **Untrusted input** is limited to imported files, which are validated as described above.
- `npm audit` is part of CI and must be clean.

## Deployment

`main` is the only long-lived branch. Vercel builds and deploys it on every push, and builds a preview for every pull request.

Because the build is a static export, redirects and response headers cannot live in `next.config.js`; they are in `vercel.json`.

The `[missionId]` and `[topicId]` routes are split into a server component with `generateStaticParams()` and a client component so that every mission and topic page can be prerendered. The static export depends on this.

## License

[MIT](LICENSE)
