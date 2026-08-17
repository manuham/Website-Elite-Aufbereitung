/* ─── Pricing · the single source of truth for money ─────────────────────────
   Base prices live as plain NUMBERS in src/data/services.js. Everything that
   turns a number into a euro string, or applies the vehicle-size factor, goes
   through here — there is no second copy anywhere. (Before this module the same
   price string was parsed back to a number by three different regexes and
   formatted by nine inline template literals.)

   Vehicle-size model (Preisliste, Stand August 2026):
     Endpreis = Grundpreis × Faktor, kaufmännisch auf 5 € gerundet, PER LINE ITEM.

   That replaced a flat "+55/75/95 € once per booking" surcharge — the old model
   was too expensive on small services and too cheap on big ones. The factors and
   the rounding rule are pinned against the client's own worked example table in
   `pricing.test.js`; do not "simplify" roundTo5 without re-running it.

   Never multiplied by the factor: the Anfahrtspauschale, the per-package
   Mobil-Aufpreis, and the four services flagged `sizeSurcharge: false` in
   services.js (Scheinwerfer, Textilimprägnierung, Armaturen/Türverkleidung,
   Dachhimmel) — there the effort does not depend on how big the car is.
-----------------------------------------------------------------------------*/

import { serviceCategories, tierPackages } from '../data/services';

/** Flat Anfahrtspauschale for the mobile service. Not multiplied by the size factor. */
export const MOBILE_SURCHARGE = 65;

/**
 * Vehicle classes and their price factor. `factor: null` = "auf Anfrage": we show the
 * un-scaled sum and say the uplift is quoted after seeing the vehicle.
 */
export const VEHICLE_SIZES = [
    { id: 'kleinwagen', name: 'Kleinwagen', factor: 1, examples: 'z. B. VW Polo, Opel Corsa, Ford Fiesta', description: 'Kurze Autos, 2–4 Türen' },
    { id: 'kompakt', name: 'Kompaktklasse', factor: 1.15, examples: 'z. B. VW Golf, Audi A3, BMW 1er', description: 'Standardgröße, die meisten Autos' },
    { id: 'mittelklasse', name: 'Mittelklasse / Limousine', factor: 1.3, examples: 'z. B. VW Passat, Audi A6, BMW 5er', description: 'Länger, oft 4 Türen + Kofferraum' },
    { id: 'suv', name: 'SUV / Van', factor: 1.5, examples: 'z. B. Audi Q7, BMW X5, VW Tiguan', description: 'Höher, größer, mehr Innenraum' },
    { id: 'gross', name: 'Großfahrzeuge / Transporter', factor: null, examples: 'z. B. VW Bus, Sprinter, Wohnmobil', description: 'Deutlich größer, gewerblich/Family Vans' },
];

export const vehicleSizeById = (id) => VEHICLE_SIZES.find(s => s.id === id) || null;

/**
 * The set of service/package IDs whose price scales with vehicle size, DERIVED from the
 * `sizeSurcharge` flag in services.js so the data stays the single source of truth —
 * flip the flag there and every surface (booking steps, totals, calendar mail) follows.
 * Individual services have no `id` field: theirs is `${categoryId}-${arrayIndex}`.
 */
export const SIZED_IDS = new Set([
    ...tierPackages.filter(p => p.sizeSurcharge).map(p => p.id),
    ...serviceCategories.flatMap(cat =>
        cat.packages.flatMap((pkg, i) => (pkg.sizeSurcharge ? [`${cat.id}-${i}`] : []))
    ),
]);

export const isSized = (id) => SIZED_IDS.has(id);

// ─── Maths ───────────────────────────────────────────────────────────────────

/** Kaufmännisch (half-up) to the nearest 5 €, as the price list prescribes. */
export const roundTo5 = (n) => Math.round(n / 5) * 5;

/**
 * Grundpreis × Faktor, rounded to 5 €. A null factor ("auf Anfrage") leaves the base alone.
 *
 * The product is snapped to cents FIRST. Binary floating point cannot hold 1,15 exactly, so
 * `350 * 1.15` is 402.49999999999994 — half a cent below the .5 boundary, which would round
 * Bronze/Kompakt DOWN to 400 € where the client's table says 405 €. Snapping to cents restores
 * the 402,50 the arithmetic is meant to produce. (Pinned by the golden table in pricing.test.js.)
 */
export const applyFactor = (base, factor) => {
    if (factor == null || factor === 1) return base;
    return roundTo5(Math.round(base * factor * 100) / 100);
};

/** What one cart line costs for the chosen size — base price if it is exempt or no size is picked. */
export function linePrice(item, size) {
    const base = item?.priceNum || 0;
    if (!size || size.factor == null || !isSized(item.id)) return base;
    return applyFactor(base, size.factor);
}

/**
 * Per-package Mobil-Aufpreis on top of the flat Anfahrtspauschale: the most
 * equipment-intensive package in the cart sets it (published €45–85). MAX, not sum, so
 * overlapping equipment for two premium jobs isn't double-charged. Not size-scaled.
 */
export function mobilePackageSurchargeOf(items, serviceMode) {
    if (serviceMode !== 'mobil') return 0;
    return (items || []).reduce((max, i) => Math.max(max, i.mobilSurcharge || 0), 0);
}

/**
 * Every number the booking flow needs, in one place (it used to be recomputed by hand in
 * Step 1, StepVehicle, Step 4 and handleSubmit — four chances to drift apart).
 *
 * `size` may be null (Step 1, before the vehicle is chosen) — then nothing is scaled.
 * `onRequest` is true only when a size-scaled service meets the "auf Anfrage" class, which
 * is what makes the UI show "ab €X,- + Aufpreis auf Anfrage" instead of a firm total.
 */
export function computeTotals(items = [], serviceMode = null, size = null) {
    const anySized = items.some(i => isSized(i.id));
    const baseTotal = items.reduce((sum, i) => sum + (i.priceNum || 0), 0);
    const sizedTotal = items.reduce((sum, i) => sum + linePrice(i, size), 0);
    const anfahrt = serviceMode === 'mobil' ? MOBILE_SURCHARGE : 0;
    const mobilPkg = mobilePackageSurchargeOf(items, serviceMode);

    return {
        baseTotal,
        sizedTotal,
        sizeDelta: sizedTotal - baseTotal,
        anySized,
        onRequest: anySized && !!size && size.factor == null,
        anfahrt,
        mobilPkg,
        total: sizedTotal + anfahrt + mobilPkg,
    };
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/*  Number formatting is pinned to `de-DE`, NOT `de-AT`, on purpose. Both use the comma as the
    decimal separator, but current ICU groups de-AT thousands with a narrow no-break space
    ("1 250"), so prices used to render as "ab €1 890,-". The client's price list — and Austrian
    price signage generally — writes "1.250 €" with a dot. de-DE gives that, identically in every
    browser and Node version. Dates elsewhere in the app stay on de-AT. */
const GROUPED = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });

/** 1250 → "€1.250,-" */
export const formatEuro = (n) => `€${GROUPED.format(Math.round(n || 0))},-`;

/** 1250 → "ab €1.250,-". Every published price is an "ab" price — the list insists on it. */
export const formatFrom = (n) => `ab ${formatEuro(n)}`;

/** 1.15 → "×1,15", 1 → "×1,0" */
export const formatFactor = (f) => `×${f.toLocaleString('de-DE', { minimumFractionDigits: 1 })}`;

/** The factor as shown on a vehicle-class row: "×1,15" | "×1,0 · kein Aufschlag" | "auf Anfrage" */
export function sizeFactorLabel(size) {
    if (!size) return '';
    if (size.factor == null) return 'auf Anfrage';
    if (size.factor === 1) return `${formatFactor(size.factor)} · kein Aufschlag`;
    return formatFactor(size.factor);
}

/** What goes into the calendar event / notification mail: "×1,15 (Kompaktklasse)" */
export function sizeFactorForRecord(size, anySized) {
    if (!size) return '';
    if (!anySized) return `${size.name} · kein Größenfaktor`;
    if (size.factor == null) return `${size.name} · Aufpreis auf Anfrage`;
    return `${formatFactor(size.factor)} (${size.name})`;
}

/** A price as published on a card, including any per-unit note ("ab €50,- pro Sitz"). */
export const formatServicePrice = (pkg) =>
    (pkg.priceSuffix ? `${formatFrom(pkg.price)} ${pkg.priceSuffix}` : formatFrom(pkg.price));
