/**
 * Replay Vercel's routing against the real dist/ tree, without deploying.
 *
 * ⚠ What this is and is not: it resolves vercel.json the way Vercel documents it
 *   (redirects → filesystem → rewrites) against the files the build actually produced.
 * It proves the config and the output agree. It is NOT a wire-level test — only a preview
 * deployment can prove what the CDN really returns. Report it as config-level confirmation.
 *
 * Run: node scripts/seo/verify-routing.mjs   (after npm run build)
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { routes, canonicalFor } from './routes.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const distDir = join(repoRoot, 'dist');
const config = JSON.parse(readFileSync(join(repoRoot, 'vercel.json'), 'utf8'));

/** Vercel `source` patterns are path-to-regexp with inline regex groups. This covers the forms used here. */
function sourceToRegExp(source) {
    // Sources here are either literal paths or a single regex group, e.g. /((?!assets/).*)
    const pattern = source
        .replace(/[.+?^${}|[\]\\]/g, (c) => (source.includes('(') ? c : `\\${c}`))
        .replace(/\/:[A-Za-z0-9_]+\*/g, '/.*');
    return new RegExp(`^${pattern}$`);
}

/** Does a path resolve to a real file in dist/? Mirrors Vercel's directory-index behaviour. */
function filesystemHit(pathname) {
    const clean = pathname.replace(/^\//, '');
    if (clean === '') return existsSync(join(distDir, 'index.html')) ? 'index.html' : null;
    const direct = join(distDir, clean);
    if (existsSync(direct) && !existsSync(join(direct, 'index.html'))) {
        try {
            if (readFileSync(direct)) return clean;
        } catch {
            /* a directory — fall through to the index lookup */
        }
    }
    const asIndex = join(distDir, clean, 'index.html');
    if (existsSync(asIndex)) return `${clean}/index.html`;
    return null;
}

/** Resolve one request the way Vercel would. */
export function resolveRequest(pathname) {
    // 1. redirects — before the filesystem, before rewrites.
    for (const rule of config.redirects ?? []) {
        if (sourceToRegExp(rule.source).test(pathname)) {
            return {
                status: rule.statusCode ?? (rule.permanent ? 308 : 307),
                location: rule.destination,
            };
        }
    }

    // 2. filesystem.
    const direct = filesystemHit(pathname);
    if (direct) return { status: 200, file: direct };

    // 3. rewrites, in order; the first whose destination resolves wins.
    for (const rule of config.rewrites ?? []) {
        const match = pathname.match(sourceToRegExp(rule.source));
        if (!match) continue;

        // Substitute the capture groups, e.g. /api/(.*) -> /api/$1.
        const destination = rule.destination.replace(/\$(\d+)/g, (_, n) => match[Number(n)] ?? '');

        if (destination.startsWith('/api/')) {
            // Serverless functions live in api/ and are never part of dist/.
            const fn = join(repoRoot, `${destination.replace(/^\//, '')}.js`);
            if (existsSync(fn)) return { status: 200, fn: destination };
            continue; // no such function — keep looking, and 404 if nothing else matches
        }
        const target = filesystemHit(destination);
        if (target) return { status: 200, file: target };
    }

    // 4. nothing matched.
    return { status: 404 };
}

function titleOf(file) {
    const html = readFileSync(join(distDir, file), 'utf8');
    return html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? null;
}

function canonicalOf(file) {
    const html = readFileSync(join(distDir, file), 'utf8');
    return html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/)?.[1] ?? null;
}

const WIX = [
    ['/kopie-von-polieren', '/elite-endstufe'],
    ['/kopie-von-innenreinigung', '/'],
    ['/services-7', '/'],
    ['/kopie-von-versiegeln-1', '/elite-endstufe'],
    ['/kopie-von-versiegeln', '/elite-endstufe'],
    ['/jetzt-buchen', '/buchen'],
    ['/s-projects-side-by-side', '/projekte'],
];

function main() {
    if (!existsSync(join(distDir, 'index.html'))) {
        console.error('dist/ is missing — run `npm run build` first.');
        process.exit(1);
    }

    const failures = [];
    const ok = (label) => console.log(`  ok    ${label}`);
    const bad = (label, detail) => {
        failures.push(`${label} — ${detail}`);
        console.log(`  FAIL  ${label} — ${detail}`);
    };

    console.log('\nLegacy Wix URLs (expect 301 + Location):');
    for (const [from, to] of WIX) {
        const res = resolveRequest(from);
        if (res.status === 301 && res.location === to) ok(`${from} -> 301 ${to}`);
        else bad(from, `got ${res.status}${res.location ? ` -> ${res.location}` : ''}, expected 301 -> ${to}`);
    }

    console.log('\nRoutes (expect 200 + own document, distinct title, self-referencing www canonical):');
    const seenTitles = new Map();
    for (const route of routes) {
        const res = resolveRequest(route.path);
        if (res.status !== 200 || !res.file) {
            bad(route.path, `got ${res.status}`);
            continue;
        }
        const title = titleOf(res.file);
        const canonical = canonicalOf(res.file);
        const expected = canonicalFor(route.path);
        if (seenTitles.has(title)) {
            bad(route.path, `shares its title with ${seenTitles.get(title)}`);
        } else if (canonical !== expected) {
            bad(route.path, `canonical ${canonical}, expected ${expected}`);
        } else {
            seenTitles.set(title, route.path);
            ok(`${route.path.padEnd(18)} -> ${res.file.padEnd(28)} "${title}"`);
        }
    }

    console.log('\nDeleted endpoint and unknown paths (expect 404, not the SPA shell):');
    for (const path of ['/api/reviews', '/api/does-not-exist']) {
        const res = resolveRequest(path);
        if (res.status === 404) ok(`${path} -> 404`);
        else bad(path, `got ${res.status}${res.file ? ` (${res.file})` : ''}, expected 404`);
    }

    console.log('\nLive API routes (must still reach their function, not the SPA shell):');
    for (const path of ['/api/availability', '/api/book', '/api/faq-log']) {
        const res = resolveRequest(path);
        if (res.status === 200 && res.fn === path) ok(`${path} -> ${res.fn}`);
        else bad(path, `got ${res.status}${res.file ? ` (${res.file})` : ''}, expected the serverless function`);
    }

    console.log('\nUnknown page paths (expect the SPA shell, which renders the 404 page):');
    const unknown = resolveRequest('/gibt-es-nicht');
    if (unknown.status === 200 && unknown.file === 'index.html') ok('/gibt-es-nicht -> SPA shell');
    else bad('/gibt-es-nicht', `got ${unknown.status}`);

    console.log('');
    if (failures.length) {
        console.error(`✗ ${failures.length} routing check(s) failed.\n`);
        process.exit(1);
    }
    console.log('✓ Routing resolves as intended (config-level; a preview deploy is still the wire test).\n');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('verify-routing.mjs')) {
    main();
}
