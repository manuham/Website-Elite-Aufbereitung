/**
 * Generate responsive derivatives for every image the site actually references, and write the
 * manifest that <Img> renders from.
 *
 * Run manually — `npm run images:optimize` — not as part of the build. The outputs and the manifest
 * are committed, so a Vercel build never has to install or run sharp, and the byte savings are
 * visible in the diff.
 *
 * WebP plus a same-format fallback, no AVIF, deliberately: a <link rel=preload as=image> can only
 * usefully name one format, and shipping both makes the preload miss for whichever half of the
 * audience got the other one.
 *
 * Sources are never modified or deleted — they stay as the masters, and they stay reachable so
 * existing image-search results keep resolving.
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, dirname, basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(repoRoot, 'public');
const manifestFile = join(repoRoot, 'src', 'data', 'imageManifest.js');

/** Candidate widths. Never upscaled — anything wider than the source is dropped. */
const WIDTHS = [640, 1280, 1536];

/**
 * Quality 88, not the usual 75-80. Measured against the sources at identical pixel size that is
 * ~38-40 dB PSNR versus ~35 dB at q78, and still removes the large majority of the weight. These
 * are a detailing business's before/after photos — visible compression artefacts on paint are the
 * one thing that would undercut the product.
 */
const WEBP = { quality: 88, effort: 6 };

/**
 * Anything with an alpha channel here is artwork, not a photograph — the logo. Lossy WebP is built
 * for photographs and puts visible ringing on flat colour and hard edges.
 *
 * Measured on logo-new2.png at 640w: lossy q88 is 26 kB at 35.8 dB (scoring only the pixels the
 * logo actually paints); near-lossless is 22 kB at 55.3 dB. Smaller *and* dramatically closer to
 * the original, so there is no trade to make.
 */
const WEBP_ARTWORK = { nearLossless: true, quality: 90, effort: 6 };

const JPEG = { quality: 88, mozjpeg: true, progressive: true };
const PNG = { compressionLevel: 9, palette: true };

function walk(dir, test, out = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) walk(p, test, out);
        else if (test.test(entry.name)) out.push(p);
    }
    return out;
}

/**
 * A generated derivative, e.g. IMG_2195-640.webp or logo-new2-1280.png. Never an input.
 *
 * The width must be three digits or more. `-\d+` also matched camera masters whose filenames
 * end in a short duplicate suffix — P1345294-2.jpg, P1334477-2.jpg, P1335024-2.jpg — so those
 * were classified as this script's own output and skipped on every run, forever. They never got
 * a manifest entry, so <Img> fell through to a bare <img> on the 542 kB master: no srcset, no
 * WebP, and no width/height to reserve layout. One of them was on the homepage.
 *
 * Three digits is safe because every generated width comes from WIDTHS (640/1280/1536) or
 * min(sourceWidth, 1536), so a derivative is never narrower than 640.
 */
const DERIVATIVE = /-\d{3,}\.(?:webp|jpe?g|png)$/i;

/**
 * Only touch images the site actually loads.
 *
 * The generated manifest is excluded from the scan on purpose: it lists every derivative, so
 * reading it back would feed the previous run's outputs in as this run's inputs and the library
 * would grow on every invocation.
 */
function referencedUrls() {
    const code = [...walk(join(repoRoot, 'src'), /\.(jsx?|html)$/), join(repoRoot, 'index.html')]
        .filter((f) => !f.endsWith(join('data', 'imageManifest.js')))
        .map((f) => readFileSync(f, 'utf8'))
        .join('\n');

    const urls = new Set();
    for (const match of code.matchAll(/\/assets\/[^"'`\s)]+\.(?:jpe?g|png)/gi)) {
        const url = decodeURI(match[0]);
        if (!DERIVATIVE.test(url)) urls.add(url);
    }
    return [...urls].sort();
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} kB`;

async function main() {
    const urls = referencedUrls();
    const manifest = {};
    let sourceTotal = 0;
    let bestTotal = 0;
    const skipped = [];

    for (const url of urls) {
        const source = join(publicDir, url.replace(/^\//, '').split('/').join(sep));
        if (!existsSync(source)) {
            skipped.push(`${url} — referenced but missing on disk`);
            continue;
        }

        const input = readFileSync(source);
        const meta = await sharp(input).metadata();
        const hasAlpha = Boolean(meta.hasAlpha);
        const dir = dirname(source);
        const stem = basename(source, extname(source));
        const urlDir = url.slice(0, url.lastIndexOf('/'));

        // Standard widths below the source, plus the source's own width so the largest candidate
        // always matches the master exactly. Without that last one a 1024px-wide source would top
        // out at the 640 candidate and every desktop would upscale it.
        // Capped at the widest standard size — a 3000px logo does not need a 3000px derivative.
        const widths = [
            ...new Set([
                ...WIDTHS.filter((w) => w < meta.width),
                Math.min(meta.width, Math.max(...WIDTHS)),
            ]),
        ].sort((a, b) => a - b);

        const sources = [];
        for (const width of widths) {
            const buf = await sharp(input)
                .resize({ width })
                .webp(hasAlpha ? WEBP_ARTWORK : WEBP)
                .toBuffer();
            // An already-well-compressed source can come out *bigger* as WebP. Emitting that would
            // make the page slower, so drop the candidate and let a narrower one (or the original)
            // serve instead.
            if (buf.length >= input.length) continue;
            const out = join(dir, `${stem}-${width}.webp`);
            writeFileSync(out, buf);
            sources.push({ w: width, url: `${urlDir}/${stem}-${width}.webp`, bytes: buf.length });
        }

        if (!sources.length) {
            skipped.push(
                `${url} — already smaller than anything WebP produces (${kb(input.length)}), left as is`
            );
            continue;
        }

        // Fallback keeps the source's own format so transparency survives.
        const fallbackWidth = Math.min(1280, meta.width);
        const ext = hasAlpha ? 'png' : 'jpg';
        const fallbackPath = join(dir, `${stem}-${fallbackWidth}.${ext}`);
        const pipeline = sharp(input).resize({ width: fallbackWidth });
        const fallbackBuf = await (hasAlpha ? pipeline.png(PNG) : pipeline.jpeg(JPEG)).toBuffer();
        writeFileSync(fallbackPath, fallbackBuf);

        sourceTotal += input.length;
        bestTotal += sources.at(-1).bytes;

        manifest[url] = {
            width: meta.width,
            height: meta.height,
            srcset: sources.map((s) => `${s.url} ${s.w}w`).join(', '),
            fallback: `${urlDir}/${stem}-${fallbackWidth}.${ext}`,
        };

        console.log(
            `  ${url.padEnd(46)} ${String(meta.width + 'x' + meta.height).padEnd(10)} ` +
                `${kb(input.length).padStart(8)} -> ${kb(sources.at(-1).bytes).padStart(8)}` +
                `${hasAlpha ? '  (alpha → png fallback)' : ''}`
        );
    }

    const header = `/**
 * Generated by scripts/optimize-images.mjs — do not edit by hand.
 * Run \`npm run images:optimize\` after adding or replacing an image.
 *
 * Maps each source image URL to its intrinsic size, its WebP srcset and a same-format fallback.
 * <Img> (src/components/Img.jsx) renders from this; the intrinsic width/height is what stops the
 * layout shifting as each image arrives.
 */
`;
    writeFileSync(
        manifestFile,
        `${header}\nexport const imageManifest = ${JSON.stringify(manifest, null, 4)};\n`,
        'utf8'
    );

    console.log(`\n  ${urls.length} referenced images`);
    console.log(`  sources                        ${kb(sourceTotal).padStart(10)}`);
    console.log(`  largest WebP each (worst case) ${kb(bestTotal).padStart(10)}`);
    console.log(
        `  ${(100 - (bestTotal / sourceTotal) * 100).toFixed(1)} % smaller, and smaller again on any viewport that picks a narrower candidate`
    );
    console.log(`  manifest -> ${relative(repoRoot, manifestFile)}`);
    if (skipped.length) {
        console.log('\n  SKIPPED:');
        for (const s of skipped) console.log(`    ${s}`);
    }

    // Unreferenced masters are left alone on purpose — see the note at the top.
    const allImages = walk(join(publicDir, 'assets'), /\.(jpe?g|png)$/i).filter(
        (f) => !/-\d+\.(jpe?g|png)$/i.test(f)
    );
    const orphans = allImages.filter((f) => {
        const url = '/' + relative(publicDir, f).split(sep).join('/');
        return !manifest[url];
    });
    if (orphans.length) {
        const bytes = orphans.reduce((sum, f) => sum + statSync(f).size, 0);
        console.log(
            `\n  ${orphans.length} images in public/assets are referenced by no page (${(bytes / 1048576).toFixed(1)} MB).`
        );
        console.log('  Left untouched: they are masters and stay reachable for image search.');
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
