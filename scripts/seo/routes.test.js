import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

import { routes, canonicalFor, outputFileFor, SITE_ORIGIN } from './routes.mjs';

const appSource = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');

describe('SEO route table', () => {
    it('covers every <Route path> declared in src/App.jsx', () => {
        // Drift guard. The two files share no import; adding a route in App.jsx without adding it
        // here means the new page silently inherits the homepage's title and canonical — which is
        // the bug this whole pass exists to fix.
        const declared = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)]
            .map((m) => m[1])
            .filter((p) => p !== '*'); // the 404 catch-all is not a prerendered route
        const known = routes.map((r) => r.path);
        expect([...declared].sort()).toEqual([...known].sort());
    });

    it('has nine routes', () => {
        expect(routes).toHaveLength(9);
    });

    it('gives every route a distinct title', () => {
        const titles = routes.map((r) => r.title);
        expect(new Set(titles).size).toBe(titles.length);
    });

    it('gives every route a distinct description', () => {
        const descriptions = routes.map((r) => r.description);
        expect(new Set(descriptions).size).toBe(descriptions.length);
    });

    it.each(routes)('$path has a title within a sane SERP length', (route) => {
        expect(route.title.length).toBeGreaterThanOrEqual(20);
        expect(route.title.length).toBeLessThanOrEqual(70);
    });

    it.each(routes)('$path has a description within a sane SERP length', (route) => {
        expect(route.description.length).toBeGreaterThanOrEqual(70);
        expect(route.description.length).toBeLessThanOrEqual(200);
    });

    it.each(routes)('$path canonical is absolute, self-referencing and on the www host', (route) => {
        const canonical = canonicalFor(route.path);
        expect(canonical.startsWith(`${SITE_ORIGIN}/`)).toBe(true);
        // The apex 307s to www, so an apex canonical never resolves to itself.
        expect(canonical).not.toMatch(/^https:\/\/eliteaufbereitung\.at/);
        expect(canonical).toBe(route.path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route.path}`);
    });

    it.each(routes)('$path quotes no price', (route) => {
        // Packages change; stale prices in meta descriptions are worse than generic ones.
        const meta = `${route.title} ${route.description}`;
        expect(meta).not.toMatch(/€/);
        expect(meta).not.toMatch(/\bEUR\b/i);
        expect(meta).not.toMatch(/\b\d+\s*(?:Euro|,-)/i);
    });

    it('preloads the hero only where the hero actually renders', () => {
        const preloading = routes.filter((r) => r.preloadHero).map((r) => r.path);
        expect(preloading).toEqual(['/', '/mobiler-service']);
    });

    it('writes each route to its own directory index', () => {
        expect(outputFileFor('/')).toBe('index.html');
        expect(outputFileFor('/projekte')).toBe('projekte/index.html');
        const files = routes.map((r) => outputFileFor(r.path));
        expect(new Set(files).size).toBe(files.length);
    });
});
