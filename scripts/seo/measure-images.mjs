/**
 * What each page actually costs in image bytes, before and after.
 *
 * Resolves every <picture>/<img> in the built HTML the way a browser would: apply `sizes` at a
 * given viewport, pick the narrowest candidate that still covers the slot at that DPR, and sum the
 * files on disk. Compares against the original masters the page used to load.
 *
 * Run: node scripts/seo/measure-images.mjs   (after npm run build)
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { routes, outputFileFor } from './routes.mjs';
import { imageManifest } from '../../src/data/imageManifest.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const distDir = join(repoRoot, 'dist');
const publicDir = join(repoRoot, 'public');

const VIEWPORTS = [
    { name: 'mobile  390px @2x', width: 390, dpr: 2 },
    { name: 'desktop 1440px @1x', width: 1440, dpr: 1 },
];

const bytesOf = (url) => {
    const p = join(publicDir, url.replace(/^\//, '').split('/').join(sep));
    return existsSync(p) ? statSync(p).size : 0;
};

/** Evaluate a `sizes` list against a viewport, returning the slot width in CSS px. */
function resolveSizes(sizes, viewportWidth) {
    if (!sizes) return viewportWidth;
    for (const part of sizes.split(',').map((s) => s.trim())) {
        const media = part.match(/^\((.+?)\)\s+(.+)$/);
        const value = media ? media[2] : part;
        if (media) {
            const min = media[1].match(/min-width:\s*(\d+)px/);
            if (min && viewportWidth < Number(min[1])) continue;
        }
        const vw = value.match(/^([\d.]+)vw$/);
        if (vw) return (Number(vw[1]) / 100) * viewportWidth;
        const px = value.match(/^([\d.]+)px$/);
        if (px) return Number(px[1]);
    }
    return viewportWidth;
}

/** Narrowest candidate that still covers slotWidth * dpr, else the widest available. */
function pick(srcset, slotWidth, dpr) {
    const candidates = srcset.split(',').map((c) => {
        const [url, w] = c.trim().split(/\s+/);
        return { url, w: Number(w.replace('w', '')) };
    });
    const needed = slotWidth * dpr;
    return (candidates.find((c) => c.w >= needed) ?? candidates.at(-1)).url;
}

const originalOf = new Map(Object.entries(imageManifest));

console.log('\nImage bytes per page — what the browser actually downloads\n');

const totals = VIEWPORTS.map(() => ({ before: 0, after: 0 }));

for (const route of routes) {
    const file = join(distDir, outputFileFor(route.path));
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');

    // Every <source srcset> in the document, plus its sibling sizes.
    const pictures = [
        ...html.matchAll(/<source[^>]*srcSet="([^"]*)"[^>]*sizes="([^"]*)"[^>]*>/gi),
        ...html.matchAll(/<source[^>]*srcset="([^"]*)"[^>]*sizes="([^"]*)"[^>]*>/gi),
    ];

    const line = [route.path.padEnd(18)];
    VIEWPORTS.forEach((vp, i) => {
        let after = 0;
        let before = 0;
        const seenAfter = new Set();
        const seenBefore = new Set();

        for (const [, srcset, sizes] of pictures) {
            const slot = resolveSizes(sizes, vp.width);
            const chosen = pick(srcset, slot, vp.dpr);
            if (!seenAfter.has(chosen)) {
                seenAfter.add(chosen);
                after += bytesOf(chosen);
            }
            // the master this srcset was generated from
            const master = [...originalOf].find(([, v]) => v.srcset === srcset)?.[0];
            if (master && !seenBefore.has(master)) {
                seenBefore.add(master);
                before += bytesOf(master);
            }
        }

        totals[i].before += before;
        totals[i].after += after;
        const pct = before ? `${(100 - (after / before) * 100).toFixed(0)}%` : '—';
        line.push(
            `${(before / 1024).toFixed(0).padStart(6)} → ${(after / 1024).toFixed(0).padStart(5)} kB  (-${pct.padStart(3)})`
        );
    });
    console.log('  ' + line.join('   '));
}

console.log('\n  ' + ' '.repeat(18) + '   ' + VIEWPORTS.map((v) => v.name.padEnd(26)).join(' '));
console.log(
    '  ' +
        'ALL NINE'.padEnd(18) +
        '   ' +
        totals
            .map(
                (t) =>
                    `${(t.before / 1048576).toFixed(1)} → ${(t.after / 1048576).toFixed(1)} MB  (-${(100 - (t.after / t.before) * 100).toFixed(0)}%)`.padEnd(26)
            )
            .join(' ')
);
console.log('');
