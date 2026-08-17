import { describe, it, expect } from 'vitest';
import {
    MOBILE_SURCHARGE, VEHICLE_SIZES, vehicleSizeById, SIZED_IDS, isSized,
    roundTo5, applyFactor, linePrice, computeTotals, mobilePackageSurchargeOf,
    formatEuro, formatFrom, formatFactor, sizeFactorLabel, sizeFactorForRecord, formatServicePrice,
} from './pricing.js';
import { serviceCategories, tierPackages } from '../data/services.js';

const size = (id) => vehicleSizeById(id);
const item = (id, priceNum, extra = {}) => ({ id, priceNum, ...extra });

// ── A. The golden table ──────────────────────────────────────────────────────
// Every cell of the client's own worked example ("So sieht das gerechnet aus",
// preisliste-eliteaufbereitung.md). This pins the rounding rule to their document:
// it fails if rounding moves from half-up to half-even, from per-line to per-sum,
// or if any factor changes. Do not "fix" a failure by editing the expectations.
describe('applyFactor — client price table', () => {
    const KLEIN = 1, KOMPAKT = 1.15, MITTEL = 1.3, SUV = 1.5;

    const TABLE = [
        // [label,                  base,  klein, kompakt, mittel, suv]
        ['Basic Handwäsche', 95, 95, 110, 125, 145],
        ['Premium Innenreinigung', 230, 230, 265, 300, 345],
        ['Verkaufsaufbereitung', 390, 390, 450, 505, 585],
        ['Bronze', 350, 350, 405, 455, 525],
        ['Beschichtungspaket', 1250, 1250, 1440, 1625, 1875],
        ['Endstufe', 2600, 2600, 2990, 3380, 3900],
    ];

    for (const [label, base, klein, kompakt, mittel, suv] of TABLE) {
        it(`${label} (${base} €) scales to ${klein}/${kompakt}/${mittel}/${suv}`, () => {
            expect(applyFactor(base, KLEIN)).toBe(klein);
            expect(applyFactor(base, KOMPAKT)).toBe(kompakt);
            expect(applyFactor(base, MITTEL)).toBe(mittel);
            expect(applyFactor(base, SUV)).toBe(suv);
        });
    }

    it('rounds half-up to 5 € — the exact cases the table depends on', () => {
        expect(roundTo5(402.5)).toBe(405);   // Bronze × 1,15
        expect(roundTo5(142.5)).toBe(145);   // Basic Handwäsche × 1,5
        expect(roundTo5(1437.5)).toBe(1440); // Beschichtungspaket × 1,15
        expect(roundTo5(264.5)).toBe(265);
        expect(roundTo5(507)).toBe(505);     // rounds DOWN — 101.4 → 101
    });

    it('leaves the base untouched for "auf Anfrage" (null factor)', () => {
        expect(applyFactor(350, null)).toBe(350);
    });

    it('rounds per line item, not on the cart total', () => {
        // Two 55 € services at ×1,3 is a case where the two rules disagree:
        //   per line → 71,5 rounds to 70, twice = 140   ← what the price list prescribes
        //   on the sum → 110 × 1,3 = 143 rounds to 145
        expect(applyFactor(55, 1.3) * 2).toBe(140);
        expect(roundTo5(110 * 1.3)).toBe(145);

        const twoLines = [item('politur-2', 55), item('zusatz-9', 55)];
        expect(computeTotals(twoLines, 'studio', size('mittelklasse')).sizedTotal).toBe(140);
    });
});

// ── B. Which services scale ──────────────────────────────────────────────────
describe('SIZED_IDS', () => {
    // The price list names exactly these as exempt (plus the Anfahrtspauschale):
    // "Vom Größenfaktor ausgenommen sind außerdem: Scheinwerfer-Aufbereitung,
    //  Textilimprägnierung, Armaturenbrett-Pflege und Dachhimmel."
    const EXEMPT = {
        'politur-3': 'Scheinwerfer-Aufbereitung mit UV-Schutz',
        'zusatz-5': 'Textilimprägnierung (pro Sitz)',
        'zusatz-6': 'Türverkleidung & Armaturen',
        'zusatz-7': 'Dachhimmel Intensivreinigung',
    };

    it('exempts exactly the four services the price list names', () => {
        const exemptIds = [];
        for (const cat of serviceCategories) {
            cat.packages.forEach((pkg, i) => {
                if (!pkg.sizeSurcharge) exemptIds.push(`${cat.id}-${i}`);
            });
        }
        expect(exemptIds.sort()).toEqual(Object.keys(EXEMPT).sort());
    });

    it('the exempt IDs still point at the services we think they do', () => {
        // Guards against a reorder in services.js silently moving the exemption
        // onto a different service (IDs are array indices).
        for (const [id, name] of Object.entries(EXEMPT)) {
            const [catId, idx] = [id.slice(0, id.lastIndexOf('-')), Number(id.slice(id.lastIndexOf('-') + 1))];
            expect(serviceCategories.find(c => c.id === catId).packages[idx].name).toBe(name);
            expect(isSized(id)).toBe(false);
        }
    });

    it('scales every tier package and every other service', () => {
        for (const pkg of tierPackages) expect(isSized(pkg.id)).toBe(true);
        expect(isSized('politur-2')).toBe(true);  // Spot-Politur — strict reading of the list
        expect(isSized('lenkrad-0')).toBe(true);
        expect(isSized('zusatz-11')).toBe(true);  // Cabrio-Verdeck
        expect(SIZED_IDS.size).toBe(
            tierPackages.length + serviceCategories.reduce((n, c) => n + c.packages.length, 0) - 4
        );
    });
});

// ── C. Totals ────────────────────────────────────────────────────────────────
describe('computeTotals', () => {
    const premiumWash = item('handwaesche-1', 155);
    const premiumInterior = item('innenreinigung-1', 230);
    const dachhimmel = item('zusatz-7', 60);

    it('sums base prices when no vehicle is chosen yet (Step 1)', () => {
        const t = computeTotals([premiumWash, premiumInterior], 'studio', null);
        expect(t.baseTotal).toBe(385);
        expect(t.total).toBe(385);
        expect(t.sizeDelta).toBe(0);
        expect(t.anySized).toBe(true);
    });

    it('multiplies each line for an SUV', () => {
        const t = computeTotals([premiumWash, premiumInterior], 'studio', size('suv'));
        expect(t.sizedTotal).toBe(235 + 345); // 155×1,5 → 232,5 → 235
        expect(t.sizeDelta).toBe(580 - 385);
        expect(t.total).toBe(580);
        expect(t.onRequest).toBe(false);
    });

    it('leaves an exempt service at its base price', () => {
        const t = computeTotals([dachhimmel], 'studio', size('suv'));
        expect(t.total).toBe(60);
        expect(t.sizeDelta).toBe(0);
        expect(t.anySized).toBe(false);
    });

    it('adds an exempt service at face value alongside a scaled one', () => {
        const withOut = computeTotals([premiumWash], 'studio', size('suv')).total;
        const withIn = computeTotals([premiumWash, dachhimmel], 'studio', size('suv')).total;
        expect(withIn - withOut).toBe(60); // exactly the base price, not 90
    });

    it('never multiplies the Anfahrtspauschale or the Mobil-Aufpreis', () => {
        const silber = item('tier-silber', 620, { mobilSurcharge: 45 });
        const studio = computeTotals([silber], 'studio', size('suv'));
        const mobil = computeTotals([silber], 'mobil', size('suv'));
        expect(mobil.anfahrt).toBe(MOBILE_SURCHARGE);
        expect(mobil.mobilPkg).toBe(45);
        expect(mobil.total - studio.total).toBe(MOBILE_SURCHARGE + 45);
    });

    it('flags Großfahrzeuge as "auf Anfrage" and quotes the un-scaled sum', () => {
        const t = computeTotals([premiumWash, premiumInterior], 'studio', size('gross'));
        expect(t.onRequest).toBe(true);
        expect(t.total).toBe(385);
        expect(t.sizeDelta).toBe(0);
    });

    it('does not flag "auf Anfrage" when nothing in the cart scales', () => {
        expect(computeTotals([dachhimmel], 'studio', size('gross')).onRequest).toBe(false);
    });

    it('is empty-safe', () => {
        const t = computeTotals([], null, null);
        expect(t.total).toBe(0);
        expect(t.anySized).toBe(false);
    });

    it('takes the MAX Mobil-Aufpreis, not the sum', () => {
        const items = [item('a', 1, { mobilSurcharge: 45 }), item('b', 1, { mobilSurcharge: 85 })];
        expect(mobilePackageSurchargeOf(items, 'mobil')).toBe(85);
        expect(mobilePackageSurchargeOf(items, 'studio')).toBe(0);
    });

    it('linePrice falls back to the base price for an unknown id', () => {
        expect(linePrice(item('does-not-exist', 100), size('suv'))).toBe(100);
    });
});

// ── D. Formatting ────────────────────────────────────────────────────────────
describe('formatting', () => {
    it('formats euros the Austrian way', () => {
        expect(formatEuro(1250)).toBe('€1.250,-');
        expect(formatEuro(95)).toBe('€95,-');
        expect(formatFrom(2600)).toBe('ab €2.600,-');
    });

    it('formats factors with one decimal minimum', () => {
        expect(formatFactor(1)).toBe('×1,0');
        expect(formatFactor(1.15)).toBe('×1,15');
        expect(formatFactor(1.3)).toBe('×1,3');
    });

    it('labels vehicle rows', () => {
        expect(sizeFactorLabel(vehicleSizeById('kleinwagen'))).toBe('×1,0 · kein Aufschlag');
        expect(sizeFactorLabel(vehicleSizeById('suv'))).toBe('×1,5');
        expect(sizeFactorLabel(vehicleSizeById('gross'))).toBe('auf Anfrage');
    });

    it('records the factor for the calendar event', () => {
        expect(sizeFactorForRecord(vehicleSizeById('kompakt'), true)).toBe('×1,15 (Kompaktklasse)');
        expect(sizeFactorForRecord(vehicleSizeById('kompakt'), false)).toBe('Kompaktklasse · kein Größenfaktor');
        expect(sizeFactorForRecord(vehicleSizeById('gross'), true))
            .toBe('Großfahrzeuge / Transporter · Aufpreis auf Anfrage');
    });

    it('appends a per-unit suffix when the service has one', () => {
        expect(formatServicePrice({ price: 50, priceSuffix: 'pro Sitz' })).toBe('ab €50,- pro Sitz');
        expect(formatServicePrice({ price: 95 })).toBe('ab €95,-');
    });
});

// ── E. Data drift guards ─────────────────────────────────────────────────────
describe('services.js data shape', () => {
    const everyPackage = [
        ...tierPackages.map(p => [p.id, p]),
        ...serviceCategories.flatMap(c => c.packages.map((p, i) => [`${c.id}-${i}`, p])),
    ];

    it('has a numeric price above zero everywhere', () => {
        for (const [id, pkg] of everyPackage) {
            expect(typeof pkg.price, `${id} (${pkg.name ?? pkg.tier})`).toBe('number');
            expect(pkg.price, `${id}`).toBeGreaterThan(0);
        }
    });

    it('gives every package exactly one duration shape', () => {
        for (const [id, pkg] of everyPackage) {
            const hasMin = pkg.durationMin != null;
            const hasDays = pkg.durationDays != null;
            expect(hasMin !== hasDays, `${id} needs exactly one of durationMin/durationDays`).toBe(true);
        }
    });

    it('keeps every Mobil-Aufpreis inside the advertised €45–85 range', () => {
        // The FAQ answer mobil-kosten quotes that range verbatim.
        for (const [id, pkg] of everyPackage) {
            if (pkg.mobilSurcharge == null) continue;
            expect(pkg.mobilSurcharge, `${id}`).toBeGreaterThanOrEqual(45);
            expect(pkg.mobilSurcharge, `${id}`).toBeLessThanOrEqual(85);
        }
    });

    it('exposes the five vehicle classes the price list defines', () => {
        expect(VEHICLE_SIZES.map(s => s.factor)).toEqual([1, 1.15, 1.3, 1.5, null]);
    });
});
