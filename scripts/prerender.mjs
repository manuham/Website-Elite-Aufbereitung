/**
 * Post-build step: turn the single SPA shell into nine real HTML documents.
 *
 * Runs after `vite build` (the client bundle) and `vite build --ssr` (the Node render entry).
 * For each route in scripts/seo/routes.mjs it renders the React tree to markup, injects it into
 * the built shell, and rewrites the head tags that must differ per page. Everything else in the
 * head — JSON-LD, robots, theme-color, Twitter card, lang, the hashed script/CSS tags — is carried
 * across byte-identical, on purpose.
 *
 * Then it writes dist/sitemap.xml and hands over to scripts/seo/guard.mjs, which fails the build if
 * the result is wrong.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

import { routes, canonicalFor, outputFileFor, SITE_ORIGIN, HERO_PRELOAD } from './seo/routes.mjs';
import { runGuard } from './seo/guard.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'dist');
const ssrEntry = join(repoRoot, 'dist-ssr', 'entry-server.js');

/** Escape a string for use inside an HTML attribute value. */
function attr(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Escape a string for use as HTML text content. */
function text(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Replace the first tag matching `pattern` with `replacement`.
 * Throws rather than silently no-op'ing — a missing tag means index.html drifted and the emitted
 * pages would quietly keep the homepage's metadata, which is the exact bug this step exists to fix.
 */
function replaceTag(html, pattern, replacement, label) {
    if (!pattern.test(html)) {
        throw new Error(
            `prerender: could not find ${label} in the built index.html — has the head been restructured?`
        );
    }
    return html.replace(pattern, () => replacement);
}

/** The hero preload link, emitted only on the routes that actually display the hero image. */
function heroPreloadTag() {
    const parts = [
        'rel="preload"',
        'as="image"',
        HERO_PRELOAD.type ? `type="${attr(HERO_PRELOAD.type)}"` : null,
        `href="${attr(HERO_PRELOAD.href)}"`,
        HERO_PRELOAD.srcset ? `imagesrcset="${attr(HERO_PRELOAD.srcset)}"` : null,
        HERO_PRELOAD.sizes ? `imagesizes="${attr(HERO_PRELOAD.sizes)}"` : null,
        'fetchpriority="high"',
    ].filter(Boolean);
    return `<link ${parts.join(' ')}>`;
}

/** Build one route's document from the shell template. */
function buildDocument(template, route, bodyHtml) {
    const canonical = canonicalFor(route.path);
    let html = template;

    html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${text(route.title)}</title>`, '<title>');

    html = replaceTag(
        html,
        /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/,
        `<meta name="description" content="${attr(route.description)}" />`,
        'the description meta'
    );

    html = replaceTag(
        html,
        /<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/?>/,
        `<link rel="canonical" href="${attr(canonical)}" />`,
        'the canonical link'
    );

    html = replaceTag(
        html,
        /<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/,
        `<meta property="og:url" content="${attr(canonical)}" />`,
        'og:url'
    );

    html = replaceTag(
        html,
        /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/,
        `<meta property="og:title" content="${attr(route.title)}" />`,
        'og:title'
    );

    html = replaceTag(
        html,
        /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/,
        `<meta property="og:description" content="${attr(route.description)}" />`,
        'og:description'
    );

    html = replaceTag(
        html,
        /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/,
        `<meta name="twitter:title" content="${attr(route.title)}" />`,
        'twitter:title'
    );

    html = replaceTag(
        html,
        /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/,
        `<meta name="twitter:description" content="${attr(route.description)}" />`,
        'twitter:description'
    );

    // The hero image is only on / and /mobiler-service. Preloading it at high priority on
    // /impressum, where it never renders, is what this placeholder exists to stop.
    html = replaceTag(
        html,
        /<!--\s*HERO_PRELOAD\s*-->/,
        route.preloadHero ? heroPreloadTag() : '',
        'the HERO_PRELOAD placeholder'
    );

    const rootPattern = /<div id="root"><\/div>/;
    if (!rootPattern.test(html)) {
        throw new Error('prerender: could not find the empty <div id="root"></div> in index.html');
    }
    html = html.replace(rootPattern, () => `<div id="root">${bodyHtml}</div>`);

    return html;
}

/**
 * lastmod for a route: the commit date of the files that render it.
 *
 * Falls back to the HEAD commit date, then to today. Vercel builds from a shallow clone, so a
 * per-file lookup can miss; HEAD is always present. Never throws — a missing date is not worth
 * failing a deploy over.
 */
function lastmodFor(sources, headDate) {
    for (const paths of [sources, null]) {
        try {
            const args = ['log', '-1', '--format=%cs'];
            if (paths) args.push('--', ...paths);
            const out = execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
        } catch {
            // git unavailable or path unknown to this clone — try the next fallback.
        }
    }
    return headDate;
}

function writeSitemap(headDate) {
    const entries = routes
        .map((route) => {
            const lastmod = lastmodFor(route.sources, headDate);
            return [
                '  <url>',
                `    <loc>${canonicalFor(route.path)}</loc>`,
                `    <lastmod>${lastmod}</lastmod>`,
                `    <changefreq>${route.changefreq}</changefreq>`,
                `    <priority>${route.priority}</priority>`,
                '  </url>',
            ].join('\n');
        })
        .join('\n');

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        entries,
        '</urlset>',
        '',
    ].join('\n');

    writeFileSync(join(distDir, 'sitemap.xml'), xml, 'utf8');
    return routes.length;
}

/**
 * react-router v7's <Link> calls useLayoutEffect internally, which React warns about on every
 * server render — once per link, per page. It is react-router's own code, we cannot fix it, and it
 * buries real errors under hundreds of lines. Filter that one message and nothing else.
 */
function silenceReactRouterLayoutEffectWarning() {
    const original = console.error;
    console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) {
            return;
        }
        original(...args);
    };
    return () => {
        console.error = original;
    };
}

async function main() {
    const template = readFileSync(join(distDir, 'index.html'), 'utf8');
    const { render } = await import(pathToFileURL(ssrEntry).href);
    const restoreConsole = silenceReactRouterLayoutEffectWarning();

    try {
        for (const route of routes) {
            let bodyHtml;
            try {
                bodyHtml = render(route.path);
            } catch (error) {
                throw new Error(`prerender: rendering ${route.path} failed — ${error.message}`, {
                    cause: error,
                });
            }

            const html = buildDocument(template, route, bodyHtml);
            const outFile = join(distDir, outputFileFor(route.path));
            mkdirSync(dirname(outFile), { recursive: true });
            writeFileSync(outFile, html, 'utf8');
            const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
            console.log(
                `  ${route.path.padEnd(18)} -> dist/${outputFileFor(route.path).padEnd(28)} ${kb.padStart(7)} kB`
            );
        }
    } finally {
        restoreConsole();
    }

    let headDate = new Date().toISOString().slice(0, 10);
    try {
        const out = execFileSync('git', ['log', '-1', '--format=%cs'], {
            cwd: repoRoot,
            encoding: 'utf8',
        }).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(out)) headDate = out;
    } catch {
        // No git in the build container — the build date is a reasonable lastmod.
    }

    const count = writeSitemap(headDate);
    console.log(`  wrote dist/sitemap.xml (${count} URLs, host ${SITE_ORIGIN})`);

    runGuard(distDir);
}

main().catch((error) => {
    console.error(`\n✗ ${error.message}\n`);
    process.exit(1);
});
