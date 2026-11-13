// Every cart the booking page can build must still be accepted by /api/book, and the calendar
// must show exactly the numbers the customer confirmed (2026-11-13, security review E1).
//
// The page side below is submit() from site/booking.js, with its cart helpers pkgItem/svcItem
// copied verbatim (booking.js is a DOM script and exports nothing). If those helpers change,
// update the copies here — this test is the guard that the server never refuses a real booking.

import { describe, it, expect } from 'vitest';
import { tierPackages, serviceCategories } from '../../site/assets/data/services.js';
import { computeBookingDuration } from '../../site/assets/data/scheduling.js';
import {
  VEHICLE_SIZES, computeTotals, linePrice, formatFrom, sizeFactorForRecord,
} from '../../site/assets/data/pricing.js';
import { FACTS } from '../../site/assets/data/facts.js';
import { validateBooking } from '../book.js';

// ── copied from site/booking.js (2026-11-13) ──
const pkgItem = (p) => ({
  id: p.id, name: `${p.tier} – ${p.name}`, priceNum: p.price, type: 'aio',
  durationMin: p.durationMin ?? null, durationDays: p.durationDays ?? null,
  mobilExtraMin: p.mobilExtraMin ?? 0, mobilSurcharge: p.mobilSurcharge ?? 0,
});
const svcItem = (cat, pkg, i) => ({
  id: `${cat.id}-${i}`, name: pkg.name, priceNum: pkg.price, type: 'service',
  priceSuffix: pkg.priceSuffix ?? null,
  durationMin: pkg.durationMin ?? null, durationDays: pkg.durationDays ?? null,
  mobilExtraMin: pkg.mobilExtraMin ?? 0, mobilSurcharge: pkg.mobilSurcharge ?? 0,
});

/** The body submit() sends for this cart. */
function pagePayload(items, size, mode) {
  const t = computeTotals(items, mode, size);
  const d = computeBookingDuration(items, mode);
  const services = items.map((i) => {
    const priceNum = linePrice(i, size);
    return { ...i, priceNum, price: i.priceSuffix ? `${formatFrom(priceNum)} ${i.priceSuffix}` : formatFrom(priceNum) };
  });
  const address = mode === 'mobil' ? 'Hauptstraße 1, 6800 Feldkirch' : '';
  return {
    date: d.multiDay ? '2026-11-16' : '2026-11-17',            // Mon / Tue, inside every season
    time: d.multiDay ? null : '09:00',
    services,
    contact: { name: 'Anna Muster', phone: '+43 664 1234567', email: 'anna@example.at', address, notes: 'Bitte anrufen.' },
    website: '',
    serviceMode: mode,
    location: mode === 'mobil' ? address : FACTS.studio.feldkirch,
    vehicleCategory: size?.name,
    vehicleSizeFactor: sizeFactorForRecord(size, t.anySized),
    mobileSurcharge: t.anfahrt,
    mobilePackageSurcharge: t.mobilPkg,
    totalStr: t.onRequest ? `${formatFrom(t.total)} + Aufpreis auf Anfrage` : formatFrom(t.total),
    photoUrls: [],
    durationMin: d.durationMin,
    multiDay: d.multiDay,
    spanDays: d.spanDays,
  };
}

const NOW = new Date('2026-11-13T09:00:00Z');
const ALL = [
  ...tierPackages.map(pkgItem),
  ...serviceCategories.flatMap((cat) => cat.packages.map((pkg, i) => svcItem(cat, pkg, i))),
];

function expectSame(items, size, mode) {
  const sent = pagePayload(items, size, mode);
  const r = validateBooking(sent, NOW);
  const label = `${items.map((i) => i.id).join('+')} / ${size.id} / ${mode}`;
  expect(r.ok, label).toBe(true);
  expect(r.data.services.map((s) => [s.name, s.price, s.priceNum]), label)
    .toEqual(sent.services.map((s) => [s.name, s.price, s.priceNum]));
  expect(r.data.totalStr, label).toBe(sent.totalStr);
  expect(r.data.vehicleSizeFactor, label).toBe(sent.vehicleSizeFactor);
  expect(r.data.mobileSurcharge, label).toBe(sent.mobileSurcharge);
  expect(r.data.mobilePackageSurcharge, label).toBe(sent.mobilePackageSurcharge);
  expect([r.data.multiDay, r.data.durationMin, r.data.spanDays], label)
    .toEqual([sent.multiDay, sent.durationMin, sent.spanDays]);
  expect(r.data.location, label).toBe(sent.location);
}

describe('every cart the page can build is accepted, with identical numbers', () => {
  it(`each of the ${ALL.length} services × every vehicle class × studio/mobil`, () => {
    for (const item of ALL) for (const size of VEHICLE_SIZES) for (const mode of ['studio', 'mobil']) {
      expectSame([item], size, mode);
    }
  });
  it('every pair of services (Kompaktklasse and the "auf Anfrage" class)', () => {
    const sizes = [VEHICLE_SIZES.find((s) => s.id === 'kompakt'), VEHICLE_SIZES.find((s) => s.factor == null)];
    for (let a = 0; a < ALL.length; a++) for (let b = a + 1; b < ALL.length; b++) {
      for (const size of sizes) for (const mode of ['studio', 'mobil']) expectSame([ALL[a], ALL[b]], size, mode);
    }
  });
  it('a big cart of five', () => {
    expectSame([ALL[0], ALL[6], ALL[9], ALL[12], ALL[20]], VEHICLE_SIZES[3], 'studio');
  });
});
