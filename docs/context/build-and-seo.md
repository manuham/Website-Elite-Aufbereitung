# Build pipeline & SEO invariants

> ## ⭐ Since the relaunch (branch `relaunch/new-design`, 2026-09-26) — read this first
>
> The site is the **new design**: ten finished static pages in `site/`, exported from the HMMR design
> folder (`10-websites/design-reviews/elite-hero-2026-09-16`, `node _build/export-live.mjs <repo>/site`).
> **Do not edit `site/` by hand** — change the design folder and export again.
>
> - `npm run build` = `node scripts/build-static.mjs`: `dist/` = `public/` + `site/`, a sitemap of the ten
>   paths, and a guard (unique titles, descriptions, www canonicals, no noindex/„Entwurf"/Google Fonts,
>   no inline script — the CSP — and every local href/src/srcset/url() must resolve). It fails the build.
> - `vercel.json`: `cleanUrls` (projekte.html serves /projekte), **no rewrites** (unknown URLs 404 → 404.html),
>   the seven Wix redirects unchanged, fonts cached immutably, images/films 30 days, nothing else long —
>   `/assets/data/pricing.js` is not hashed and must reach returning visitors.
> - The React app in `src/` is **not built any more** and stays for the way back: `npm run build:react`.
>   Everything below this box describes that React pipeline and stays true of it.
> - The `/api` functions are unchanged; the new `buchen` page calls them exactly as BookingPage.jsx did.

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

**Never write `<img>` for a site asset — use `<Img>` (`src/components/Img.jsx`).**

```jsx
<Img src="/assets/Autos/IMG_2195.jpg" sizes="(min-width: 1024px) 33vw, 100vw" alt="…" loading="lazy" />
```

It renders a `<picture>` with a WebP srcset, a same-format fallback, and the intrinsic
width/height that stops the layout shifting. Everything it needs comes from
`src/data/imageManifest.js`, generated by `npm run images:optimize`.

An image with **no manifest entry still renders** — as a plain `<img>` on the original file. Adding
an image and forgetting to run the optimizer degrades; it does not break. (Blob and Cloudinary URLs,
like the booking photo previews, deliberately stay plain `<img>`.)

### `sizes` is the part that matters

The manifest gets the formats right on its own. `sizes` is what tells the browser how wide the image
will actually render, so it can pick a narrow candidate instead of the widest one. Get it wrong and
the page still looks correct — it just downloads far more than it needs. The default is `100vw`,
which is safe but wasteful for a grid tile. The logo is the extreme case: a 3000×3000 source
rendered at 112 px.

### Workflow

```
npm run images:optimize     # regenerate derivatives + manifest (needs sharp)
npm run build
npm run images:measure      # per-page image bytes at mobile and desktop, before vs after
```

`images:optimize` is **not** part of the build — outputs and manifest are committed, so a deploy
never runs sharp. It only processes images the code actually references, and it skips its own
outputs (the manifest is excluded from the reference scan, or each run would feed the previous run's
derivatives back in as inputs).

Encoder choice is evidence-based, not taste:

- **Photographs** → lossy WebP q88. Measured 38–44 dB PSNR against the masters; >35 dB is
  indistinguishable for photographic content.
- **Anything with alpha** (the logo) → **near-lossless** WebP. Lossy puts visible ringing on flat
  colour and hard edges. At 640w the logo is 22 kB at 55 dB near-lossless versus 26 kB at 36 dB
  lossy — smaller *and* closer to the original, so there is no trade.
- A derivative that comes out **bigger** than its source is discarded, and that candidate is simply
  not offered.
- Widths are 640 / 1280 / 1536, capped at the source's own width, **plus the source width itself**
  so the largest candidate always matches the master. Without that last part a 1024 px-wide source
  would top out at 640 and every desktop would upscale it.

WebP plus a same-format fallback, no AVIF: the hero is preloaded and a `<link rel=preload as=image>`
can only usefully name one format. `HERO_PRELOAD` in `scripts/seo/routes.mjs` is **derived from the
manifest**, not hand-written, so it cannot drift out of sync with what `<Img>` renders — a mismatch
there does not break anything visibly, it just downloads the hero twice.

The original masters are kept, untouched and still reachable, so existing image-search results keep
resolving. Roughly 12 MB of `public/assets` is referenced by no page at all; it is left alone for the
same reason.

⚠ When cleaning derivatives, use `git clean -fd public/assets` — untracked files only. A
`find -regex '.*-[0-9]+\.jpg'` sweep also matches real sources like `P1334477-2.jpg`.

## ESLint

`eslint.config.js` (flat config, eslint 9 — `eslint-plugin-react` does not yet peer eslint 10).
`react-hooks/exhaustive-deps` and the react-hooks 7 compiler rules are **off on purpose**, with the
reasoning in the config: satisfying them changes when effects re-run, and several live in
`BookingPage.jsx`, which drives real bookings. Turning them on is its own piece of work.
