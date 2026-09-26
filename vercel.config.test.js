import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const config = JSON.parse(
    readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')
);

// The seven Wix URLs Google still ranks. Each carried real impressions when this was measured
// (2026-08-03), so losing one to a typo costs traffic silently — hence the table lives in a test.
const WIX_REDIRECTS = [
    ['/kopie-von-polieren', '/elite-endstufe'],
    ['/kopie-von-innenreinigung', '/'],
    ['/services-7', '/'],
    ['/kopie-von-versiegeln-1', '/elite-endstufe'],
    ['/kopie-von-versiegeln', '/elite-endstufe'],
    ['/jetzt-buchen', '/buchen'],
    ['/s-projects-side-by-side', '/projekte'],
];

describe('vercel.json — legacy Wix redirects', () => {
    it('declares exactly the seven redirects, no blanket rule', () => {
        expect(config.redirects).toHaveLength(WIX_REDIRECTS.length);
    });

    it.each(WIX_REDIRECTS)('%s redirects 301 to %s', (source, destination) => {
        const rule = config.redirects.find((r) => r.source === source);
        expect(rule, `no redirect declared for ${source}`).toBeDefined();
        expect(rule.destination).toBe(destination);
        // 301, not Vercel's default 307 and not the 308 that `permanent: true` emits.
        expect(rule.statusCode).toBe(301);
    });

    it('keeps redirects a separate key from rewrites', () => {
        // Vercel evaluates `redirects` before the filesystem and before `rewrites`, so the SPA
        // catch-all cannot shadow them. Moving these into `rewrites` would silently break that.
        expect(Array.isArray(config.redirects)).toBe(true);
        const rewriteSources = (config.rewrites ?? []).map((r) => r.source);
        for (const [source] of WIX_REDIRECTS) {
            expect(rewriteSources).not.toContain(source);
        }
    });

    it('does not redirect anything else — unknown URLs must keep 404-ing honestly', () => {
        const declared = config.redirects.map((r) => r.source).sort();
        expect(declared).toEqual(WIX_REDIRECTS.map(([s]) => s).sort());
    });
});

describe('vercel.json — clean URLs (the static relaunch, 2026-09-26)', () => {
    // Since the relaunch the site is ten finished static pages in site/ (scripts/build-static.mjs).
    // Each file is named after its path — projekte.html serves /projekte — and cleanUrls drops the
    // extension (and 308s /projekte.html to /projekte). No rewrite is needed and none may exist: the
    // old SPA catch-all would hand every unknown URL the homepage instead of an honest 404.

    it('serves the pages without their extension', () => {
        expect(config.cleanUrls).toBe(true);
    });

    it('has no rewrites at all — unknown URLs 404 honestly', () => {
        expect(config.rewrites ?? []).toEqual([]);
    });

    it('has a real document for every page, named after its path', () => {
        for (const path of [
            '/mobiler-service', '/elite-endstufe', '/projekte', '/buchen', '/kontakt',
            '/impressum', '/datenschutz', '/agb', '/widerruf',
        ]) {
            const file = new URL(`./site${path}.html`, import.meta.url);
            expect(existsSync(file), `site${path}.html is missing`).toBe(true);
        }
        expect(existsSync(new URL('./site/index.html', import.meta.url))).toBe(true);
        expect(existsSync(new URL('./site/404.html', import.meta.url))).toBe(true);
    });

    it('lands every Wix redirect on a page that exists', () => {
        for (const r of config.redirects) {
            const file = r.destination === '/' ? 'index' : r.destination.slice(1);
            expect(existsSync(new URL(`./site/${file}.html`, import.meta.url)), r.destination).toBe(true);
        }
    });

    it('builds with the static build, into dist/', () => {
        expect(config.buildCommand).toBe('npm run build');
        expect(config.outputDirectory).toBe('dist');
    });

    it('normalises trailing slashes, so /projekte/ is not a duplicate URL', () => {
        expect(config.trailingSlash).toBe(false);
    });
});

describe('vercel.json — caching', () => {
    const cacheRules = config.headers.filter((rule) =>
        rule.headers.some((h) => h.key === 'Cache-Control')
    );

    /** Vercel `source` is path-to-regexp; these rules are a literal prefix plus a regex group. */
    const matches = (source, path) => new RegExp(`^${source}$`).test(path);
    const valueOf = (rule) => rule.headers.find((h) => h.key === 'Cache-Control').value;

    it('caches only the fonts immutably', () => {
        const rule = cacheRules.find((r) => r.source.includes('fonts'));
        expect(rule).toBeDefined();
        expect(valueOf(rule)).toContain('immutable');
        expect(matches(rule.source, '/assets/fonts/inter-latin-opsz.woff2')).toBe(true);
    });

    it('caches images and films long, but NOT immutably', () => {
        const rule = cacheRules.find((r) => r.source.includes('webp'));
        expect(rule).toBeDefined();
        // stable, unhashed names that can be overwritten in place — `immutable` would strand a
        // replaced photo in caches for a year
        expect(valueOf(rule)).not.toContain('immutable');
        expect(valueOf(rule)).toContain('max-age=2592000');
        expect(matches(rule.source, '/assets/img/van-cut-900.webp')).toBe(true);
        expect(matches(rule.source, '/assets/video/mobil-reel-720.mp4')).toBe(true);
        expect(matches(rule.source, '/assets/VAN/VAN-1024.webp')).toBe(true);
    });

    it('never caches a page, a script, a stylesheet or the price data long', () => {
        // None of the relaunch's scripts and stylesheets carry a hash in their name. A long cache on
        // /assets/data/pricing.js would keep an old price in a returning visitor's browser; a cached
        // HTML document is how a deploy silently fails to reach anyone.
        const shortPaths = [
            '/', '/index.html', '/projekte', '/projekte.html', '/impressum', '/sitemap.xml', '/robots.txt',
            '/hero.css', '/booking.js', '/assets/data/pricing.js', '/assets/data/services.js', '/vendor/gsap.min.js',
        ];
        for (const rule of cacheRules) {
            for (const path of shortPaths) {
                expect(matches(rule.source, path), `cache rule "${rule.source}" must not match ${path}`).toBe(false);
            }
        }
    });
});

describe('vercel.json — security headers', () => {
    const globalRule = config.headers.find((h) => h.source === '/(.*)');
    const headerValue = (key) => globalRule.headers.find((h) => h.key === key)?.value;

    it('still applies the security headers to every path', () => {
        expect(globalRule).toBeDefined();
        expect(headerValue('X-Content-Type-Options')).toBe('nosniff');
        expect(headerValue('X-Frame-Options')).toBe('DENY');
        expect(headerValue('Strict-Transport-Security')).toBe(
            'max-age=63072000; includeSubDomains; preload'
        );
    });

    it('has not loosened the Content-Security-Policy', () => {
        // Drift guard. This CSP is deliberately strict — no 'unsafe-inline' for scripts, no
        // wildcard origins. If a change appears to need a weaker CSP, the change is wrong.
        expect(headerValue('Content-Security-Policy')).toBe(
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://res.cloudinary.com; connect-src 'self' https://api.cloudinary.com https://hook.eu1.make.com; frame-src https://www.youtube-nocookie.com https://www.youtube.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests"
        );
    });
});
