import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
    LOCATIONS,
    AREAS_SERVED,
    PHONE_DISPLAY,
    EMAIL,
    GOOGLE_PROFILE_URL,
    INSTAGRAM_URL,
    FACEBOOK_URL,
    formatAddress,
} from './business.js';

/**
 * index.html is static: it cannot import business.js, so nothing but a test keeps the two in
 * agreement. That gap is not hypothetical — it is how the site ended up publishing
 * "Ketschenstraße" to customers in the booking flow while the structured data said
 * "Ketschelenstraße", for every page, indefinitely.
 *
 * Same shape as the two drift guards this repo already relies on: vercel.config.test.js reads
 * vercel.json from disk and asserts it against a table, routes.test.js reads App.jsx as text and
 * diffs it against routes.mjs.
 */
const repoRoot = join(import.meta.dirname, '..', '..');
const indexHtml = readFileSync(join(repoRoot, 'index.html'), 'utf8');

function jsonLd() {
    const match = indexHtml.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    );
    if (!match) throw new Error('index.html no longer contains a JSON-LD block');
    return JSON.parse(match[1]);
}

describe('index.html JSON-LD agrees with business.js', () => {
    it('parses', () => {
        expect(() => jsonLd()).not.toThrow();
    });

    it('publishes the Feldkirch studio address, spelled the way the register spells it', () => {
        const { address } = jsonLd();
        expect(address.streetAddress).toBe(LOCATIONS.feldkirch.street);
        expect(address.postalCode).toBe(LOCATIONS.feldkirch.postalCode);
        expect(address.addressLocality).toBe(LOCATIONS.feldkirch.city);
    });

    it('publishes the same phone and mail the site shows', () => {
        const ld = jsonLd();
        // JSON-LD carries the E.164 form; the visible copy carries the spaced form.
        expect(ld.telephone.replace(/\s/g, '')).toBe(PHONE_DISPLAY.replace(/\s/g, ''));
        expect(ld.email).toBe(EMAIL);
    });

    it('serves every town the copy claims', () => {
        const named = jsonLd()
            .areaServed.filter((a) => a['@type'] === 'City')
            .map((a) => a.name);
        for (const town of AREAS_SERVED) expect(named).toContain(town);
    });

    it('lists the social profiles from business.js', () => {
        const { sameAs } = jsonLd();
        expect(sameAs).toContain(INSTAGRAM_URL);
        expect(sameAs).toContain(FACEBOOK_URL);
    });
});

describe('business facts', () => {
    it('never reintroduces the street name that does not exist', () => {
        // The Vorarlberg address register and the Feldkirch street directory both list
        // Ketschelenstraße; there is no Ketschenstraße in 6800.
        expect(LOCATIONS.feldkirch.street).not.toMatch(/Ketschenstra/);
        expect(indexHtml).not.toMatch(/Ketschenstra/);
    });

    it('formats a one-line address the way the booking flow prints it', () => {
        expect(formatAddress(LOCATIONS.feldkirch)).toBe('Ketschelenstraße 1, 6800 Feldkirch');
        expect(formatAddress(LOCATIONS.nueziders)).toBe('Bundesstraße 2a, 6714 Nüziders');
    });

    it('treats Nüziders as a location, not as an area we drive to', () => {
        expect(AREAS_SERVED).not.toContain('Nüziders');
    });

    it('holds the Google profile URL to an absolute google host, or to nothing at all', () => {
        // Empty is the honest state until Matthias sends it — GoogleReviews renders no link then.
        // What must never happen is a placeholder ("TODO", a search-results URL) going live.
        if (GOOGLE_PROFILE_URL === '') return;
        expect(GOOGLE_PROFILE_URL).toMatch(/^https:\/\/[a-z0-9.-]*(google\.com|goo\.gl)\//);
    });
});
