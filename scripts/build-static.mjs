/**
 * The build since the relaunch (2026-09-26): the new design is a set of finished static pages in
 * `site/`, exported from the HMMR design folder (10-websites/design-reviews/elite-hero-2026-09-16,
 * `node _build/export-live.mjs <this repo>/site`). This script only assembles `dist/` and refuses to
 * ship a page that breaks one of the site's standing promises. The React app under `src/` is no
 * longer built (it stays in the repo; `npm run build:react` still builds it — the way back).
 *
 *   1. dist/ = public/ (the old image URLs keep working — og:image, shared links) + site/ on top
 *   2. dist/sitemap.xml — exactly the ten pages, www host
 *   3. the guard — the old scripts/seo/guard.mjs, for static pages:
 *        every page exists · unique <title> · a meta description · a self-referencing canonical on
 *        the www host · no noindex · no „Entwurf" · no Google Fonts · no inline script (the CSP says
 *        script-src 'self') · no link to a .html page · every local href/src/srcset/url() resolves
 *
 * The /api functions are untouched and still deploy from api/ as before.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://www.eliteaufbereitung.at';

/** path → file. The files are named after the paths; vercel.json `cleanUrls` serves them bare. */
export const PAGES = [
    ['/', 'index.html', '1.0'],
    ['/projekte', 'projekte.html', '0.8'],
    ['/elite-endstufe', 'elite-endstufe.html', '0.8'],
    ['/mobiler-service', 'mobiler-service.html', '0.8'],
    ['/buchen', 'buchen.html', '0.8'],
    ['/kontakt', 'kontakt.html', '0.7'],
    ['/impressum', 'impressum.html', '0.5'],
    ['/datenschutz', 'datenschutz.html', '0.5'],
    ['/agb', 'agb.html', '0.5'],
    ['/widerruf', 'widerruf.html', '0.5'],
];

const fail = [];
const need = (ok, msg) => { if (!ok) fail.push(msg); };

/* 1 · dist */
if (!fs.existsSync(SITE)) throw new Error('site/ is missing — export the design first (see the header)');
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
if (fs.existsSync(PUBLIC)) fs.cpSync(PUBLIC, DIST, { recursive: true });
fs.cpSync(SITE, DIST, { recursive: true });
fs.rmSync(path.join(DIST, 'EXPORT.txt'), { force: true });

/* 2 · sitemap */
const lastmod = (file) => {
    try {
        const d = execSync(`git log -1 --format=%cs -- "site/${file}"`, { cwd: ROOT }).toString().trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    } catch { /* a shallow clone or no git: fall through */ }
    return new Date().toISOString().slice(0, 10);
};
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(([p, f, prio]) => `  <url><loc>${ORIGIN}${p}</loc><lastmod>${lastmod(f)}</lastmod><priority>${prio}</priority></url>`).join('\n')}
</urlset>
`);

/* 3 · the guard */
const titles = new Map();
const resolveLocal = (ref) => {
    let r = ref.split('#')[0].split('?')[0];
    if (!r) return true;                                   // a bare anchor or query
    r = decodeURI(r);
    if (r === '/') return fs.existsSync(path.join(DIST, 'index.html'));
    const abs = path.join(DIST, r.startsWith('/') ? r.slice(1) : r);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return true;
    return fs.existsSync(`${abs}.html`);                   // a clean page URL
};
for (const [p, file] of PAGES) {
    const f = path.join(DIST, file);
    need(fs.existsSync(f), `${p}: ${file} is missing`);
    if (!fs.existsSync(f)) continue;
    const s = fs.readFileSync(f, 'utf8');
    const title = s.match(/<title>([^<]+)<\/title>/)?.[1];
    need(title, `${p}: no <title>`);
    if (title) { need(!titles.has(title), `${p}: same <title> as ${titles.get(title)}`); titles.set(title, p); }
    need(/<meta name="description" content="[^"]{20,}"/.test(s), `${p}: no meta description`);
    need(s.includes(`<link rel="canonical" href="${ORIGIN}${p}" />`), `${p}: canonical is not ${ORIGIN}${p}`);
    need(!/noindex/.test(s), `${p}: noindex`);
    need(!/Entwurf/.test(s), `${p}: still says „Entwurf"`);
    need(!/fonts\.(googleapis|gstatic)\.com/.test(s), `${p}: loads Google Fonts`);
    need(!/https:\/\/eliteaufbereitung\.at/.test(s), `${p}: names the bare apex host (it 307s to www)`);
    const inline = s.match(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/(?:ld\+)?json")[^>]*>/g) || [];
    need(!inline.length, `${p}: ${inline.length} inline script(s) — the CSP blocks them`);
    need(!/\son(click|load|error|submit|change|input)="/.test(s), `${p}: an inline event handler — the CSP blocks it`);
    const htmlLinks = s.match(/href="(?!https?:|mailto:|tel:|#)[^"]*\.html[^"]*"/g) || [];
    need(!htmlLinks.length, `${p}: links a .html page: ${htmlLinks.slice(0, 2).join(' ')}`);
    // every local reference resolves
    const refs = [
        ...[...s.matchAll(/\s(?:href|src|poster|data-src)="([^"]+)"/g)].map((m) => m[1]),
        ...[...s.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((x) => x.trim().split(/\s+/)[0])),
    ].filter((r) => r && !/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(r));
    for (const r of new Set(refs)) need(resolveLocal(r), `${p}: ${r} does not resolve`);
}
// url() in the stylesheets
for (const css of fs.readdirSync(DIST).filter((f) => f.endsWith('.css'))) {
    const s = fs.readFileSync(path.join(DIST, css), 'utf8');
    for (const m of s.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
        const r = m[2];
        if (/^(data:|https?:|#|%23)/.test(r)) continue;   // %23 = a # inside an inline SVG data URI
        need(resolveLocal(r), `${css}: url(${r}) does not resolve`);
    }
}
need(fs.existsSync(path.join(DIST, '404.html')), '404.html is missing');

if (fail.length) {
    console.error(`build-static: ${fail.length} problem(s) — nothing may ship like this:\n  ${fail.join('\n  ')}`);
    process.exit(1);
}
const count = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0);
console.log(`build-static: ${PAGES.length} pages + 404, ${count(DIST)} files in dist/, sitemap written, guard clean`);
