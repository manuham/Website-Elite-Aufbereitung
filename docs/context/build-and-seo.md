# Build pipeline & SEO invariants

How `npm run build` works since 2026-08-03, and which properties are enforced rather than hoped for.
Read this before changing the build, adding a route, or touching `vercel.json`.

## The build has three stages

```
npm run build
  1. vite build                                    → dist/  (client bundle + the shell index.html)
  2. vite build --ssr src/entry-server.jsx         → dist-ssr/entry-server.js  (Node render entry)
  3. node scripts/prerender.mjs                    → nine real HTML documents + dist/sitemap.xml
                                                   → then scripts/seo/guard.mjs, which can fail the build
```

Before this, all nine routes served one `index.html`, so every page shipped the homepage's `<title>`
and a canonical pointing at `/`. Now each route is a real document with its own head.

`dist-ssr/` is a build artefact and is gitignored.

## Adding a route

Two places, and the build fails if you only do one:

1. `src/App.jsx` — the `<Route>`.
2. `scripts/seo/routes.mjs` — path, title, description, changefreq, priority, `preloadHero`,
   and `sources` (the files whose commit date becomes the sitemap `lastmod`).

`scripts/seo/routes.test.js` diffs the two lists. `scripts/seo/guard.mjs` then checks the emitted
document. Add a `<Route>` alone and the test fails; the new page would otherwise have silently
inherited the homepage's metadata, which is the exact bug this pipeline exists to prevent.

You will also want a rewrite in `vercel.json` (see below).

## What the guard enforces

`scripts/seo/guard.mjs` exits non-zero, failing the build, if any of these stop being true:

- every route emitted a document
- no two routes share a `<title>`
- every canonical is present, self-referencing, and on the **www** host
- every route has a meta description
- no document still names the bare apex `https://eliteaufbereitung.at` (it 307s to www)
- no `#root` is an empty shell — i.e. the render actually produced markup
- no route carries `noindex` (the legal pages are deliberately indexable)
- the sitemap lists all nine routes and nothing else
- **the preloader overlay is the first element inside `#root`** — see the next section

## Why the prerendered pages look identical to the old empty shell

This is the load-bearing detail. `#root` now contains the whole page, which would be visible before
React hydrates — except that `<Preloader>` renders first and is `fixed inset-0 z-[10000] bg-obsidian`
with both of its children at `opacity-0`. It paints as a plain obsidian rectangle: exactly what a
visitor saw when `#root` was empty.

Three things keep that true, and each will bite if changed carelessly:

| File | What it does | Why |
|---|---|---|
| `Preloader.jsx` | `useState(true)`, then resolves the return-visit gate in a **layout** effect | Reading `sessionStorage` in the state initializer crashes the Node render. Starting `true` makes server and first client render agree; resolving in a layout effect removes the overlay before paint on a return visit, so it never flashes. |
| `Hero.jsx`, `EliteEndstufe.jsx` | the entrance `gsap.set()` / `gsap.from()` run in `useIsomorphicLayoutEffect` | These elements are above the fold and now painted before React runs. An ordinary effect applies the hidden state *after* the first paint, which flashes. Below-the-fold ScrollTrigger reveals do not have this problem. |
| `FloatingParticles.jsx` | seeded LCG instead of `Math.random()` | Random values differ between server and client, making every dust mote a hydration mismatch. |

`src/main.jsx` uses `hydrateRoot`, not `createRoot` — React adopts the prerendered markup instead of
discarding it.

`src/hooks/useIsomorphicLayoutEffect.js` is `useLayoutEffect` in the browser and `useEffect` in Node.

## vercel.json

Routing order on Vercel is **redirects → headers → filesystem → rewrites**.

- **`redirects`** — the seven legacy Wix URLs, `statusCode: 301`. They must stay here rather than in
  `rewrites`: the browser URL has to change, and being in `redirects` puts them ahead of the SPA
  catch-all automatically. Note Vercel's default is 307 and `permanent: true` emits 308, so the 301
  is explicit.
- **`rewrites`** — one explicit rule per prerendered route (`/projekte` → `/projekte/index.html`),
  then the catch-all `/((?!assets/|api/).*)` → `/index.html`. The catch-all excludes `api/` so
  unknown endpoints 404 honestly instead of being handed the SPA shell.
- **`trailingSlash: false`** — without it, `/projekte/` and `/projekte` are two live URLs.
- **`headers`** — long cache for `/assets/**`, `immutable` only for the hash-named build output.
  **No rule may match an HTML document**; a cached HTML document is how a deploy fails to reach
  anyone. `vercel.config.test.js` asserts this over every cache rule.
- The **CSP is deliberately strict** and has a drift guard in `vercel.config.test.js`. If a change
  appears to need a weaker CSP, the change is wrong.

## ⚠ `npm run preview` does not match production

`vite preview` serves the homepage for `/projekte` — its SPA history fallback intercepts the
extensionless path before checking for `projekte/index.html`. The prerendered file is fine; check
`/projekte/` or `/projekte/index.html` locally. Production is unaffected because of the explicit
per-route rewrites above.

To check the routing the way Vercel resolves it, without deploying:

```
npm run build
node scripts/seo/verify-routing.mjs
```

That replays redirects → filesystem → rewrites against the real `dist/` tree. It is config-level
confirmation only — a preview deployment is still the wire test.

## Images

`npm run images:optimize` (`scripts/optimize-images.mjs`, needs `sharp`) regenerates the responsive
derivatives in `public/assets/VAN/`. It is **not** part of the build — outputs are committed, so a
deploy never runs sharp.

WebP + a JPEG fallback, no AVIF: the hero is preloaded, and a `<link rel=preload as=image>` can only
usefully name one format. `HERO_PRELOAD` in `scripts/seo/routes.mjs` must stay in lockstep with the
`<picture>` in `Hero.jsx` and `MobilerService.jsx`, or the browser downloads the image twice.

Quality is 90 rather than the usual 75–80 because the visual result has to be indistinguishable;
measured against the sources, that is ~39 dB PSNR versus ~35 dB at q78, and still ~85 % smaller.

The original PNG/JPEG masters are kept and still reachable — existing image-search results point at
them.

## ESLint

`eslint.config.js` (flat config, eslint 9 — `eslint-plugin-react` does not yet peer eslint 10).
`react-hooks/exhaustive-deps` and the react-hooks 7 compiler rules are **off on purpose**, with the
reasoning in the config: satisfying them changes when effects re-run, and several live in
`BookingPage.jsx`, which drives real bookings. Turning them on is its own piece of work.
