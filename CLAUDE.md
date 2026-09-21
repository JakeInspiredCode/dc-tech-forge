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
- **No gray text on dark backgrounds.** Text comes from three tokens — `text` / `text-dim` / `text-muted` — and `muted` is the floor: nothing that carries meaning is dimmer, and it still clears 6.6:1 on every surface. Use `text-v2-text-muted` (classes), `var(--color-v2-text-muted)` (inline styles) or `V2.text.muted` from [`lib/design/forge-v2-tokens.ts`](lib/design/forge-v2-tokens.ts) (canvas, SVG attributes, anything that gets an alpha suffix appended). Don't dim text with `opacity` either. A **solid** accent or status fill (`bg-v2-cyan`, `bg-v2-success`, `bg-v2-warning`, `bg-v2-danger`) takes dark text, `text-v2-bg-deep` — white on cyan is 1.7:1. [`lib/design/contrast.test.ts`](lib/design/contrast.test.ts) fails the build on a hard-coded gray, on token drift between the CSS and the TS mirror, on white text over a solid fill, and on any trace of the retired `forge-*` palette.
- **One palette, one page shell.** There used to be a second, older look (`forge-*` tokens: neutral grays, blue accent) on ~15 tool pages; it was ported and the tokens deleted. A tool page that scrolls uses [`ToolPage`](components/ui/tool-page.tsx) (title, subtitle, optional `actions`) — deliberately without the animated starfield, because those are screens for reading and typing. The fixed-height hubs keep the starfield.
- **Focus and motion are global — don't opt out per component.** `:focus-visible` in `globals.css` is deliberately *unlayered* so it beats Tailwind's `outline-none`; never add an inline `outline: "none"`. `prefers-reduced-motion` cuts CSS animation globally; canvas loops use `useReducedMotion()` and an `<svg>` with SMIL animation takes `useSvgMotionRef()` ([`lib/use-reduced-motion.ts`](lib/use-reduced-motion.ts)). An animation whose *last* keyframe is hidden (a toast that slides out) needs an explicit exemption there, or reduced-motion users never see it.
- **A page must be reachable, and a redirect must not shadow one.** Production had been redirecting `/progress` and Speed Run away while their pages still existed, and six hub pages had no inbound link at all. [`lib/routes.test.ts`](lib/routes.test.ts) fails on a redirect whose source still has a page, a redirect to nowhere, a page nothing links to, and a page with no document title. New tools get listed in Arsenal's `ACTIVITIES`; a client page gets its title from a sibling `layout.tsx`. There is one error boundary (`app/error.tsx` → `components/error-screen.tsx`) — don't add per-route copies.
- **Orientation lives in three places — add to them rather than inventing a fourth.** The first-run tour on the home map (`components/onboarding.tsx`); a one-line first-visit `<Hint id>` on each other hub, whose text lives in [`lib/hints.ts`](lib/hints.ts); and the Guide dialog's glossary, [`lib/glossary.ts`](lib/glossary.ts). A new themed word needs a glossary entry. A `position: fixed` overlay must not be rendered *inside* `<nav>`: the nav's `backdrop-filter` makes it the containing block, trapping the overlay in the 56px bar.
- **Phones are a first-class layout, measured not guessed.** Below `lg` both maps are lists (`sector-list.tsx`, `mission-list.tsx`): the SVG maps need ~700px of their own width to draw a title at 11px, so the switch is at `lg`, not `md`. The first-run tour has matching `COMPACT_STEPS`, keyed off `COMPACT_LAYOUT_QUERY` — keep it equal to Tailwind's `lg`. Nav tabs carry a short label under the icon below `md`. Anything tappable on a hub or in the mission flow is at least 44px on a phone (`max-md:min-h-[44px]`; every `ActionButton` already is).
- **One `<main>`**, in `app/layout.tsx`, with the skip link in front of it. Pages render `<div>`s.
- **Everything clickable is reachable and pressable from a keyboard.** Use a `<button>` or a link. Where one doesn't fit (an SVG node, a card whose body must stay readable outside the control) use `role` + `tabIndex={0}` + `onKeyDown={onActivate(...)}` from [`lib/a11y.ts`](lib/a11y.ts). Map nodes are `role="link"` with progress in their `aria-label`, and focus drives the same preview as hover. A `<canvas>` control gets real `<button>`s as fallback content (see `radar-canvas.tsx`) — and those must `stopPropagation`, because the canvas's click handler reads pointer coordinates a keyboard click doesn't have.
- **Every form control has a name** — `aria-label` or a `<label>`; a placeholder is not a name. Modals use `useModalDialog()` ([`lib/use-modal-dialog.ts`](lib/use-modal-dialog.ts)) with `role="dialog"`, `aria-modal` and `aria-labelledby`. [`lib/a11y-source.test.ts`](lib/a11y-source.test.ts) fails on an unnamed control or a bare `<div onClick>`.
- Full-height screens use the `h-below-chrome` utility (`globals.css`: `100dvh - var(--chrome-h)`, with a `vh` fallback), not a hard-coded nav height or a bare `100vh` — on a phone `vh` ignores the URL bar. `--chrome-h` grows when the sample-data banner is showing. Anything in that chrome must be *exactly* as tall as the variable says — a 1px border on the nav once gave every hub page a scrollbar.
