/**
 * The nine routes, and the <head> each one gets.
 *
 * Single source of truth: the prerenderer (scripts/prerender.mjs), the sitemap generator and the
 * build guard (scripts/seo/guard.mjs) all read this file. Adding a <Route> in src/App.jsx without
 * adding it here fails the build.
 *
 * Rules baked in here:
 *  - German. Informal "du" on the five customer-facing routes, matching the site body and the
 *    FAQ knowledge base. The four legal routes (/impressum, /datenschutz, /agb, /widerruf) stay
 *    in formal Sie-Form, matching their page bodies — do not "fix" those to du.
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
            'Fahrzeugaufbereitung in Vorarlberg: kratzfreie Handwäsche nach 2-Eimer-Methode, mehrstufige Politur und FIREBALL-Keramikversiegelung. Auf Wunsch mobil — wir kommen zu dir.',
        changefreq: 'monthly',
        priority: '1.0',
        preloadHero: true,
        sources: ['src/App.jsx', 'src/components/Hero.jsx', 'src/components/Pricing.jsx'],
    },
    {
        path: '/mobiler-service',
        title: 'Mobile Autoaufbereitung — wir kommen zu dir | Elité',
        description:
            'Mobile Fahrzeugaufbereitung in ganz Vorarlberg. Der voll ausgestattete Elité-Van kommt zu dir nach Hause oder ins Büro — Wunschtermin online wählbar.',
        changefreq: 'monthly',
        priority: '0.8',
        preloadHero: true,
        sources: ['src/pages/MobilerService.jsx'],
    },
    {
        path: '/elite-endstufe',
        title: 'Elité Endstufe — Politur & Keramikversiegelung | Vorarlberg',
        description:
            'Acht Arbeitsschritte über fünf Werktage: 3-Gang Politur, Felgen zerlegt und keramikbeschichtet, Motorraum und Einstiege versiegelt, FIREBALL-Keramik auf dem Lack.',
        changefreq: 'monthly',
        priority: '0.8',
        preloadHero: false,
        sources: ['src/pages/EliteEndstufe.jsx'],
    },
    {
        path: '/projekte',
        title: 'Unsere Arbeiten — Fahrzeugaufbereitung | Elité Vorarlberg',
        description:
            'Eigene Aufnahmen aus dem Studio in Feldkirch und vom mobilen Einsatz in Vorarlberg: Lackaufbereitung, Lederreinigung und Felgenpflege. Beschriftet ist nur, was im Bild zu sehen ist.',
        changefreq: 'monthly',
        priority: '0.8',
        preloadHero: false,
        sources: ['src/pages/Projekte.jsx'],
    },
    {
        path: '/buchen',
        title: 'Termin buchen — Autoaufbereitung Vorarlberg | Elité',
        description:
            'Wunschtermin online wählen: Standort, Leistung, Fahrzeugklasse und Zeitfenster in fünf Schritten — im Studio in Feldkirch oder mobil bei dir vor Ort.',
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
