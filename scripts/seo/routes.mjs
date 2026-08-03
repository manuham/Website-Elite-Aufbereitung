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

/**
 * Hero image shared by / and /mobiler-service — preloaded only on those two routes.
 *
 * Must stay in lockstep with the <picture> in Hero.jsx and MobilerService.jsx: the browser only
 * reuses a preload when format, srcset and sizes resolve to the same candidate it would have picked
 * anyway. A mismatch does not break the page, it just downloads the image twice.
 */
export const HERO_PRELOAD = {
    href: '/assets/VAN/VAN-1024.webp',
    type: 'image/webp',
    srcset: '/assets/VAN/VAN-640.webp 640w, /assets/VAN/VAN-1024.webp 1024w',
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
        title: 'Vorher & Nachher — unsere Aufbereitungen | Elité Vorarlberg',
        description:
            'Echte Ergebnisse aus Vorarlberg im direkten Vergleich: ziehen Sie den Regler und sehen Sie, was aus jedem Fahrzeug wird.',
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
