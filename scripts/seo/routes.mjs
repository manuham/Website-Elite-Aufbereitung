/**
 * The nine routes, and the <head> each one gets.
 *
 * Single source of truth: the prerenderer (scripts/prerender.mjs), the sitemap generator and the
 * build guard (scripts/seo/guard.mjs) all read this file. Adding a <Route> in src/App.jsx without
 * adding it here fails the build.
 *
 * Rules baked in here:
 *  - German, Sie-Form.
 *  - www host, because that is the host that actually serves (the apex 307s to it).
 *  - No prices. The packages change and stale meta is worse than generic meta.
 *  - All nine stay indexable. The legal pages do NOT get noindex.
 */

export const SITE_ORIGIN = 'https://www.eliteaufbereitung.at';

import { imageManifest } from '../../src/data/imageManifest.js';

/** The hero image shared by / and /mobiler-service. Both render it full-bleed. */
const HERO_SRC = '/assets/VAN/VAN.png';

/**
 * Hero preload, derived from the generated manifest rather than written out by hand.
 *
 * It has to resolve to the exact candidate <Img> would have picked, or the browser preloads one
 * file and then downloads a different one — a silent doubling rather than a visible break. Reading
 * the same manifest the component reads is what makes that impossible.
 */
export const HERO_PRELOAD = {
    // The widest WebP candidate — href must name a WebP, not the raster fallback, or browsers that
    // take the <source> would preload a file they then never use.
    href: imageManifest[HERO_SRC].srcset.split(',').pop().trim().split(' ')[0],
    type: 'image/webp',
    srcset: imageManifest[HERO_SRC].srcset,
    sizes: '100vw',
};

export const routes = [
    {
        path: '/',
        title: 'Autoaufbereitung Vorarlberg | Elité Auto Aufbereitung',
        description:
            'Professionelle Fahrzeugaufbereitung in Vorarlberg — kratzerfreie Handwäsche, Politur und Keramikversiegelung. Auf Wunsch mobil: wir kommen zu Ihnen.',
        changefreq: 'monthly',
        priority: '1.0',
        preloadHero: true,
        sources: ['src/App.jsx', 'src/components/Hero.jsx', 'src/components/Pricing.jsx'],
    },
    {
        path: '/mobiler-service',
        title: 'Mobile Autoaufbereitung — wir kommen zu Ihnen | Elité',
        description:
            'Mobile Fahrzeugaufbereitung in ganz Vorarlberg. Der voll ausgestattete Elité-Van kommt zu Ihnen nach Hause oder ins Büro — Termin online wählbar.',
        changefreq: 'monthly',
        priority: '0.8',
        preloadHero: true,
        sources: ['src/pages/MobilerService.jsx'],
    },
    {
        path: '/elite-endstufe',
        title: 'Elité Endstufe — Politur & Keramikversiegelung | Vorarlberg',
        description:
            'Das komplette Aufbereitungspaket: mehrstufige Lackpolitur, Lackinspektion und FIREBALL-Keramikbeschichtung. Für Fahrzeuge, bei denen kein Detail übrig bleiben soll.',
        changefreq: 'monthly',
        priority: '0.8',
        preloadHero: false,
        sources: ['src/pages/EliteEndstufe.jsx'],
    },
    {
        path: '/projekte',
        // Was "Vorher & Nachher" + "ziehen Sie den Regler". The page had no before/after and
        // no regler: the slider faked its "before" with a grayscale filter on the same photo.
        // Meta that promises something the page cannot deliver is the worst kind of drift —
        // it is the sentence Google shows in the result.
        title: 'Unsere Arbeit — Aufbereitungen aus dem Studio | Elité Vorarlberg',
        description:
            'Aufnahmen aus unserem Studio in Vorarlberg: Handwäsche, Politur, Innenaufbereitung und Keramikversiegelung — echte Fahrzeuge, keine Stockfotos.',
        changefreq: 'monthly',
        priority: '0.8',
        preloadHero: false,
        sources: ['src/pages/Projekte.jsx'],
    },
    {
        path: '/buchen',
        title: 'Termin buchen — Autoaufbereitung Vorarlberg | Elité',
        description:
            'Wunschtermin online wählen: Leistung, Fahrzeug und Zeitfenster in wenigen Schritten — im Studio oder mobil bei Ihnen vor Ort.',
        changefreq: 'monthly',
        priority: '0.8',
        preloadHero: false,
        sources: ['src/pages/BookingPage.jsx', 'src/components/booking/WeekCalendar.jsx'],
    },
    {
        path: '/impressum',
        title: 'Impressum | Elité Auto Aufbereitung',
        description:
            'Angaben gemäß § 5 ECG — Elité Auto Aufbereitung, Inhaber Matthias Kaufmann.',
        changefreq: 'yearly',
        priority: '0.5',
        preloadHero: false,
        sources: ['src/pages/Impressum.jsx'],
    },
    {
        path: '/datenschutz',
        title: 'Datenschutzerklärung | Elité Auto Aufbereitung',
        description:
            'Wie Elité Auto Aufbereitung personenbezogene Daten verarbeitet — Rechtsgrundlagen, Auftragsverarbeiter, Speicherdauer und Ihre Rechte.',
        changefreq: 'yearly',
        priority: '0.5',
        preloadHero: false,
        sources: ['src/pages/Datenschutz.jsx'],
    },
    {
        path: '/agb',
        title: 'AGB | Elité Auto Aufbereitung',
        description:
            'Allgemeine Geschäftsbedingungen von Elité Auto Aufbereitung — Vertragsabschluss, Leistungen, Zahlung, Stornierung und Gewährleistung.',
        changefreq: 'yearly',
        priority: '0.5',
        preloadHero: false,
        sources: ['src/pages/AGB.jsx'],
    },
    {
        path: '/widerruf',
        title: 'Widerrufsbelehrung | Elité Auto Aufbereitung',
        description:
            'Ihr Widerrufsrecht bei online gebuchten Leistungen — Fristen, Ausübung, Folgen und Muster-Widerrufsformular.',
        changefreq: 'yearly',
        priority: '0.5',
        preloadHero: false,
        sources: ['src/pages/Widerruf.jsx'],
    },
];

/** Absolute, self-referencing canonical for a route. `/` keeps its trailing slash, nothing else has one. */
export function canonicalFor(path) {
    return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

/** Where the prerendered document for a route is written, relative to dist/. */
export function outputFileFor(path) {
    return path === '/' ? 'index.html' : `${path.slice(1)}/index.html`;
}
