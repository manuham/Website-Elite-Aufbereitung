/**
 * The business facts, in one place.
 *
 * Why this file exists: the Feldkirch street name was spelled "Ketschenstraße" on every
 * customer-facing surface (the booking flow three times, the FAQ once) and "Ketschelenstraße" in
 * the JSON-LD. Only the JSON-LD was right — the Vorarlberg address register and the Feldkirch
 * street directory both list Ketschelenstraße, and no Ketschenstraße exists in 6800. The address
 * was duplicated across seven files with no single source, which is exactly how one of them drifts
 * and nobody notices.
 *
 * Same pattern as src/data/faqKnowledge.js, which interpolates every euro amount from
 * src/lib/pricing.js rather than repeating it: a fact worth stating twice is worth importing.
 *
 * Plain ESM with no imports of its own, so Vitest can read it under Node and a build script can
 * too. src/data/business.test.js asserts the JSON-LD in index.html still agrees with it — that
 * file is static HTML and cannot import, so a test is the only thing holding the two together.
 *
 * Address confirmed by the client 2026-08-25: Ketschelenstraße 1, 6800 Feldkirch.
 */

export const LEGAL_NAME = 'Elité Auto Aufbereitung';
export const OWNER = 'Matthias Kaufmann';

/** Both locations. `nueziders` is the registered seat named in the Impressum. */
export const LOCATIONS = {
    feldkirch: {
        id: 'feldkirch',
        label: 'Feldkirch',
        street: 'Ketschelenstraße 1',
        postalCode: '6800',
        city: 'Feldkirch',
        country: 'Österreich',
    },
    nueziders: {
        id: 'nueziders',
        label: 'Nüziders',
        street: 'Bundesstraße 2a',
        postalCode: '6714',
        city: 'Nüziders',
        country: 'Österreich',
    },
};

/** "Ketschelenstraße 1, 6800 Feldkirch" — the one-line form used in the booking flow and the FAQ. */
export function formatAddress(loc) {
    return `${loc.street}, ${loc.postalCode} ${loc.city}`;
}

export const PHONE_DISPLAY = '+43 664 2546078';
export const PHONE_HREF = 'tel:+436642546078';
export const EMAIL = 'info.eliteaufbereitung@gmail.com';

export const INSTAGRAM_URL = 'https://www.instagram.com/eliteaufbereitung/';
export const FACEBOOK_URL =
    'https://www.facebook.com/people/Elit%C3%A9-Autoaufbereitung/61555761685065/';

/**
 * The Google Business Profiles.
 *
 * There are three, confirmed 2026-08-25 — two studios and a separate listing for the mobile
 * service. Stored as clean `kgmid` search URLs rather than the share.google links they came from:
 * a share link carries session and campaign parameters (`rlz`, `sca_esv`, `utm_source`) that
 * identify the browser it was copied from, and it is a redirect Google can retire. The knowledge
 * -graph id is the stable part.
 *
 * TODO(Manuel): confirm which of the two studio listings is the primary one — the reviews in
 * src/data/reviews.js were hand-copied from one of them, and GOOGLE_PROFILE_URL should point at
 * the same profile the visitor is about to read. Swapping it is a one-line change.
 */
export const GOOGLE_PROFILES = [
    { id: 'studio-a', label: 'Elité Auto Aufbereitung', url: 'https://www.google.com/search?kgmid=/g/11wbtzqnbm' },
    { id: 'studio-b', label: 'Elité Auto Aufbereitung', url: 'https://www.google.com/search?kgmid=/g/11xcnkv80t' },
    { id: 'mobil', label: 'Elité Auto Aufbereitung Mobil', url: 'https://www.google.com/search?kgmid=/g/11nq94qknd' },
];

/**
 * The profile the reviews section links to.
 *
 * Empty would render no link at all — that discipline stays in GoogleReviews.jsx, because an
 * unsourced rating under a Google logo is a claim about Google's data. There is still no rating
 * and no review count on the site; this is only a way for a visitor to go and check.
 */
export const GOOGLE_PROFILE_URL = GOOGLE_PROFILES[0].url;

/**
 * Ceramic durability, as a manufacturer figure — never as a "Garantie".
 *
 * docs/context/open-questions.md records "is the 40.000–60.000 km durability a written guarantee?"
 * as unanswered, and the FAQ (entry `info-garantie`) deflects it on purpose. Four marketing
 * surfaces asserted "Garantie" anyway. In Austria a Garantie is a defined, binding undertaking
 * (§ 9b KSchG) that requires a Garantieerklärung; advertising one you have not issued is a
 * different order of problem from loose copy. Until Matthias confirms, the site says how long it
 * holds, not what it guarantees.
 */
export const KERAMIK_DURABILITY_KM = '40.000 – 60.000 km';

/**
 * Where the mobile service goes. The union of every town already named in the copy
 * (src/components/Footer.jsx and the FAQ's `mobil-gebiet` answer).
 *
 * Nüziders is deliberately absent: it is a location we operate from, not an area we travel to.
 */
export const AREAS_SERVED = [
    'Bludenz',
    'Feldkirch',
    'Rankweil',
    'Götzis',
    'Hohenems',
    'Dornbirn',
    'Lustenau',
    'Bregenz',
];
