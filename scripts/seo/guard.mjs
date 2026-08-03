/**
 * Build-time SEO guard. Runs at the end of scripts/prerender.mjs and fails the build on regression.
 *
 * The bug this exists to prevent already happened once: all nine routes served one index.html, so
 * every page claimed to be the homepage. Nothing caught it — it was found months later by reading
 * production HTML by hand. These assertions are the thing that catches it next time.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { routes, canonicalFor, outputFileFor, SITE_ORIGIN } from './routes.mjs';

const APEX = 'https://eliteaufbereitung.at';

function firstMatch(html, pattern) {
    const match = html.match(pattern);
    return match ? match[1] : null;
}

export function runGuard(distDir) {
    const problems = [];
    const titles = new Map();

    for (const route of routes) {
        const file = join(distDir, outputFileFor(route.path));
        const where = `dist/${outputFileFor(route.path)}`;

        if (!existsSync(file)) {
            problems.push(`${route.path}: ${where} was not emitted`);
            continue;
        }

        const html = readFileSync(file, 'utf8');

        // 1. A title, and one nobody else has.
        const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/);
        if (!title) {
            problems.push(`${route.path}: no <title>`);
        } else if (titles.has(title)) {
            problems.push(
                `${route.path}: <title> is identical to ${titles.get(title)} — "${title}"`
            );
        } else {
            titles.set(title, route.path);
        }

        // 2. A canonical that points at this page, on the host that actually serves.
        const canonical = firstMatch(html, /<link\s+rel="canonical"\s+href="([^"]*)"/);
        const expected = canonicalFor(route.path);
        if (!canonical) {
            problems.push(`${route.path}: no canonical link`);
        } else if (canonical !== expected) {
            problems.push(
                `${route.path}: canonical is "${canonical}", expected "${expected}" (self-referencing, www host)`
            );
        }

        // 3. A description.
        const description = firstMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/);
        if (!description) problems.push(`${route.path}: no meta description`);

        // 4. Nothing still naming the apex, which 307s away.
        const apexHits = html.split(APEX).length - 1;
        const wwwHits = html.split(`${SITE_ORIGIN}`).length - 1;
        if (apexHits > wwwHits) {
            problems.push(
                `${route.path}: still references the bare apex ${APEX} (which redirects to www)`
            );
        }

        // 5. Real markup, not an empty shell. This is what separates a prerendered page from the
        //    identical-shell bug the whole step exists to fix. Measured from #root to </body>,
        //    because Vite hoists the module script into <head> — there is no tag after the root div
        //    to anchor on.
        const rootAt = html.indexOf('<div id="root">');
        const bodyEnd = html.indexOf('</body>');
        const rendered =
            rootAt === -1 || bodyEnd === -1
                ? ''
                : html.slice(rootAt + '<div id="root">'.length, bodyEnd).trim();
        if (rendered.length < 1000) {
            problems.push(
                `${route.path}: #root holds only ${rendered.length} chars — the render produced an empty shell`
            );
        }

        // 6. Indexable. The legal pages are deliberately included; none of the nine gets noindex.
        if (/<meta\s+name="robots"[^>]*noindex/i.test(html)) {
            problems.push(`${route.path}: carries noindex`);
        }
    }

    // 7. The sitemap lists every route, on the www host.
    const sitemapFile = join(distDir, 'sitemap.xml');
    if (!existsSync(sitemapFile)) {
        problems.push('dist/sitemap.xml was not emitted');
    } else {
        const sitemap = readFileSync(sitemapFile, 'utf8');
        for (const route of routes) {
            const loc = `<loc>${canonicalFor(route.path)}</loc>`;
            if (!sitemap.includes(loc)) problems.push(`sitemap.xml: missing ${loc}`);
        }
        const locCount = sitemap.split('<loc>').length - 1;
        if (locCount !== routes.length) {
            problems.push(`sitemap.xml: has ${locCount} <loc> entries, expected ${routes.length}`);
        }
    }

    if (problems.length) {
        throw new Error(
            `SEO guard failed — ${problems.length} problem(s):\n` +
                problems.map((p) => `    • ${p}`).join('\n')
        );
    }

    console.log(`  SEO guard passed: ${routes.length} routes, distinct titles, self-referencing www canonicals`);
}
