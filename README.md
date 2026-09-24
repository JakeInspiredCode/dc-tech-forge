# DC-Tech-Forge

A training app for people preparing to work as data center technicians — Linux, networking, server hardware, power and cooling, fiber, and operations. It teaches through guided missions, spaced-repetition flashcards, timed drills, and a simulated terminal where you work real-looking tickets.

**Live:** https://forge.jakebuildsfunthings.com — add `?demo=1` to open it with sample progress already filled in.

It is a static, local-first web app: everything you do is saved in your own browser, and there is nothing to sign up for. Optionally, claim a **callsign** to keep your progress across devices and appear in the shared **Fleet Log**; that part talks to a small Supabase project (see *Cloud*, below).

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
- **Fleet Log.** The home board and Profile → History list what you did most recently — missions accomplished, badges earned, drills, tickets and study sessions — as ids the app turns into words, never as free text.

### Your data

- Progress lives in `localStorage` under `dctf:` keys, all declared in [lib/storage-keys.ts](lib/storage-keys.ts).
- **Settings → Your data** exports everything to a JSON file and imports it elsewhere. Browser storage is per-origin, so this is how you move progress between devices or browsers.
- Imported files are treated as untrusted: every record is rebuilt from a whitelist of known fields and type-checked, and a file is rejected whole if any part of it is invalid ([lib/data/backup.ts](lib/data/backup.ts)).
- **Sample progress** fills a fresh account with a few weeks of made-up activity so you can see the app in use. It is always labelled with a banner, and "Start fresh" clears it.

### Cloud (optional)

- **A callsign, not an account.** Profile → Identity lets you claim a callsign. You get a 128-bit *recovery code* — no email, no password — which is the only way to sign in on another device. Progress here stays local either way.
- **What is stored:** the callsign, a hash of the code, your save (the backup file minus shipped card content — study state, history, your own cards and stories), and your Fleet Log rows. Rows carry content ids and numbers only; the only text you write that others see is the callsign, and it is checked against a strict pattern in the database.
- **Sync rules:** every change is pushed a couple of seconds later; on load, a browser with unsaved changes pushes, otherwise it pulls a newer save. Last writer wins. Signing in where both sides have progress asks which to keep.
- **The boundary:** the browser holds only the public key. What it can reach is exactly the `forge_*` functions and the `fleet_log` view in [supabase/schema.sql](supabase/schema.sql) — no table directly. Anything that comes down is validated like an imported backup before it touches the store.
- **Top pilots (this week):** the home board's second tab ranks callsigns by XP earned since Monday (UTC). `forge_save` records the XP total from the profile in each save and, on a pilot's first save of a week, a baseline — so XP from before you joined, or from last week, never counts. Read from the `weekly_board` view; a week's gain is capped at 100,000.
- **Deploying:** the schema is applied by every Vercel build ([scripts/db-migrate.mjs](scripts/db-migrate.mjs)) from the connection string the Supabase integration provides; `npm run cloud:smoke` exercises the live project with the public key. A free Supabase project pauses after a week of silence, so [keep-alive.yml](.github/workflows/keep-alive.yml) reads one row twice a week.

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

The app has no API routes, server actions, or middleware, so it is deployed as static files — there is no server runtime to attack. The only server-side code is [supabase/schema.sql](supabase/schema.sql): a few SQL functions behind row-level security, callable with the public key.

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
