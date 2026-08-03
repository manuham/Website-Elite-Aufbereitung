import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

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
        const rewriteSources = config.rewrites.map((r) => r.source);
        for (const [source] of WIX_REDIRECTS) {
            expect(rewriteSources).not.toContain(source);
        }
    });

    it('does not redirect anything else — unknown URLs must keep 404-ing honestly', () => {
        const declared = config.redirects.map((r) => r.source).sort();
        expect(declared).toEqual(WIX_REDIRECTS.map(([s]) => s).sort());
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
