/**
 * Generate the responsive derivatives for the VAN imagery.
 *
 * Run manually — `npm run images:optimize` — not as part of the build. The outputs are committed,
 * so a Vercel build never has to install or run sharp, and the byte savings are visible in the diff.
 *
 * WebP only, no AVIF, deliberately: the hero is preloaded, a <link rel=preload as=image> can only
 * usefully name one format, and shipping both would make the preload miss for whichever half of the
 * audience got the other one. WebP is supported by every browser this site targets; the JPEG is the
 * <picture> fallback.
 *
 * Sources are never modified or deleted — they stay as the masters.
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vanDir = join(repoRoot, 'public', 'assets', 'VAN');

/**
 * `widths` never exceeds a source's own width — upscaling adds bytes and no detail.
 * VAN.png is only 1024 px wide to begin with, which is why nothing larger is emitted for it.
 */
const TARGETS = [
    { file: 'VAN.png', widths: [640, 1024], fallbackWidth: 1024 },
    { file: 'VAN_Auto.jpg', widths: [640, 1024], fallbackWidth: 1024 },
    { file: 'VAN_Matthias.jpg', widths: [640, 1024], fallbackWidth: 1024 },
];

/**
 * Quality 90, not the more aggressive 75-80 you would normally reach for.
 *
 * Measured against the sources at the same pixel size: q78 gives PSNR ~35 dB, q90 gives ~39 dB.
 * The brief's hard constraint is that the visual result be indistinguishable, and bytes are the
 * thing being measured — q90 still removes ~85 % of the weight, which is the win either way.
 */
const WEBP = { quality: 90, effort: 6 };
const JPEG = { quality: 88, mozjpeg: true, progressive: true };

function kb(bytes) {
    return `${(bytes / 1024).toFixed(1)} kB`;
}

async function main() {
    let sourceTotal = 0;
    let emittedTotal = 0;
    const rows = [];

    for (const target of TARGETS) {
        const source = join(vanDir, target.file);
        if (!existsSync(source)) throw new Error(`missing source: ${source}`);

        const stem = basename(target.file, extname(target.file));
        const input = readFileSync(source);
        const meta = await sharp(input).metadata();
        sourceTotal += input.length;
        rows.push([`${target.file} (source, ${meta.width}x${meta.height})`, input.length, '']);

        for (const width of target.widths) {
            if (width > meta.width) {
                console.log(`  skip ${stem}-${width}.webp — source is only ${meta.width}px wide`);
                continue;
            }
            const out = join(vanDir, `${stem}-${width}.webp`);
            const buf = await sharp(input).resize({ width }).webp(WEBP).toBuffer();
            writeFileSync(out, buf);
            emittedTotal += buf.length;
            rows.push([`${stem}-${width}.webp`, buf.length, '←']);
        }

        const fallback = join(vanDir, `${stem}-${target.fallbackWidth}.jpg`);
        const fallbackBuf = await sharp(input)
            .resize({ width: Math.min(target.fallbackWidth, meta.width) })
            .jpeg(JPEG)
            .toBuffer();
        writeFileSync(fallback, fallbackBuf);
        emittedTotal += fallbackBuf.length;
        rows.push([`${stem}-${target.fallbackWidth}.jpg`, fallbackBuf.length, '←']);
    }

    const width = Math.max(...rows.map((r) => r[0].length));
    console.log('');
    for (const [label, bytes, marker] of rows) {
        console.log(`  ${marker.padEnd(2)}${label.padEnd(width)}  ${kb(bytes).padStart(10)}`);
    }
    console.log('');
    console.log(`  sources          ${kb(sourceTotal).padStart(10)}`);
    console.log(`  emitted          ${kb(emittedTotal).padStart(10)}`);

    // What a visitor actually downloads: the largest WebP per image, not every derivative.
    const shipped = TARGETS.reduce((sum, t) => {
        const stem = basename(t.file, extname(t.file));
        const largest = join(vanDir, `${stem}-${Math.max(...t.widths)}.webp`);
        return sum + statSync(largest).size;
    }, 0);
    console.log(`  largest WebP per image (what a desktop visitor fetches): ${kb(shipped)}`);
    console.log(`  was ${kb(sourceTotal)} — ${(100 - (shipped / sourceTotal) * 100).toFixed(1)}% smaller\n`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
