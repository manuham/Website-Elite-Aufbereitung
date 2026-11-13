// Server-side booking rules (2026-11-13, security review E1/E6).
//
// Until now /api/book trusted the browser for everything that shapes the calendar: the date
// window, how long the job takes, how many days the car stays, and the service names and prices
// written into the owner's calendar. A script could therefore block weeks of the calendar with
// two requests, or put "€1" / a payment link into the owner's calendar as if the shop had quoted it.
//
// This module rebuilds all of that from the service IDs alone, using the SAME data modules the
// booking page uses (site/assets/data/*, copied by `_build/booking-data.mjs`), so the server can
// never drift from what the customer was shown. Pure functions — no I/O — so they are unit-tested.

import { tierPackages, serviceCategories } from '../../site/assets/data/services.js';
import { computeBookingDuration, HORIZON_DAYS } from '../../site/assets/data/scheduling.js';
import {
  VEHICLE_SIZES, linePrice, computeTotals, formatFrom, sizeFactorForRecord,
} from '../../site/assets/data/pricing.js';
import { FACTS } from '../../site/assets/data/facts.js';

export { HORIZON_DAYS };

const TZ = 'Europe/Vienna';
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

// ─── dates (Europe/Vienna, as plain YYYY-MM-DD strings) ──────────────────────

/** Today in Vienna as YYYY-MM-DD. */
export function viennaToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Minutes since midnight, Vienna wall clock. */
export function viennaNowMin(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour').value);
  const m = Number(parts.find((p) => p.type === 'minute').value);
  return h * 60 + m;
}

export function addDaysIso(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function weekdayOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Last day of a multi-day span (Mon–Fri only), mirroring workingSpan() in scheduling.js. */
export function spanEnd(startIso, count) {
  let ds = startIso;
  let last = startIso;
  let got = 0;
  for (let guard = 0; got < count && guard < 60; guard++) {
    const w = weekdayOf(ds);
    if (w >= 1 && w <= 5) { got++; last = ds; }
    ds = addDaysIso(ds, 1);
  }
  return last;
}

/**
 * The window the booking page can offer: from today to the end of the loaded horizon.
 * One day of slack on each side absorbs a customer whose phone clock is in another time zone.
 * ISO strings compare correctly as strings.
 */
export function inBookingWindow(iso, now = new Date()) {
  if (typeof iso !== 'string' || !ISO_RE.test(iso)) return false;
  if (addDaysIso(iso, 0) !== iso) return false;         // a real calendar day: no 2026-11-31, 2026-12-99
  const today = viennaToday(now);
  return iso >= addDaysIso(today, -1) && iso <= addDaysIso(today, HORIZON_DAYS);
}

// ─── the cart, rebuilt from IDs ──────────────────────────────────────────────

/**
 * The package or service behind an id (same lookup as sourceOf() in site/booking.js), or null.
 * Refused as well (review 2026-11-13): a non-canonical index ("keramik-01" used to resolve but
 * skip the size factor and the dedupe) and anything marked `phoneOnly` — the page sends those
 * to the phone dialog and never lets them into a cart.
 */
export function itemForId(id) {
  if (typeof id !== 'string' || id.length > 80) return null;
  const p = tierPackages.find((x) => x.id === id);
  if (p) {
    if (p.phoneOnly) return null;
    return {
      id: p.id, name: `${p.tier} – ${p.name}`, priceNum: p.price, priceSuffix: null, until: p.until || null,
      durationMin: p.durationMin ?? null, durationDays: p.durationDays ?? null,
      mobilExtraMin: p.mobilExtraMin ?? 0, mobilSurcharge: p.mobilSurcharge ?? 0,
    };
  }
  const m = id.match(/^([a-z][a-z0-9-]*)-(0|[1-9]\d{0,2})$/);
  if (!m) return null;
  const cat = serviceCategories.find((c) => c.id === m[1]);
  const idx = Number(m[2]);
  const pkg = cat && Object.hasOwn(cat.packages, idx) ? cat.packages[idx] : null;
  if (!pkg || pkg.phoneOnly) return null;
  return {
    id, name: pkg.name, priceNum: pkg.price, priceSuffix: pkg.priceSuffix ?? null, until: pkg.until || null,
    durationMin: pkg.durationMin ?? null, durationDays: pkg.durationDays ?? null,
    mobilExtraMin: pkg.mobilExtraMin ?? 0, mobilSurcharge: pkg.mobilSurcharge ?? 0,
  };
}

/** The vehicle class the page sent (it sends the class NAME), or null. */
export function sizeForName(name) {
  return VEHICLE_SIZES.find((s) => s.name === name) || null;
}

/** Studio addresses the page can send for an in-studio booking. */
export const STUDIO_ADDRESSES = Object.values(FACTS.studio);

/**
 * Rebuild every number of a booking from the service IDs, the vehicle class and the mode.
 * Mirrors submit() in site/booking.js line for line, so the calendar shows exactly what the
 * customer confirmed — but now nothing in it can be chosen by the caller.
 * @returns {{ ok: true, items, duration, lines, totalStr, vehicleSizeFactor, anfahrt, mobilPkg } | { ok: false, why }}
 */
export function rebuildCart(serviceIds, vehicleName, serviceMode) {
  if (!Array.isArray(serviceIds) || serviceIds.length < 1 || serviceIds.length > 20) return { ok: false, why: 'services' };
  const ids = [...new Set(serviceIds)];
  const items = ids.map(itemForId);
  if (items.some((i) => !i)) return { ok: false, why: 'unknown_service' };

  const size = sizeForName(vehicleName);
  if (!size) return { ok: false, why: 'vehicle' };

  const mode = serviceMode === 'mobil' ? 'mobil' : 'studio';
  const t = computeTotals(items, mode, size);
  const lines = items.map((i) => {
    const priceNum = linePrice(i, size);
    return { id: i.id, name: i.name, priceNum, price: i.priceSuffix ? `${formatFrom(priceNum)} ${i.priceSuffix}` : formatFrom(priceNum) };
  });

  return {
    ok: true,
    items,
    duration: computeBookingDuration(items, mode),
    lines,
    totalStr: t.onRequest ? `${formatFrom(t.total)} + Aufpreis auf Anfrage` : formatFrom(t.total),
    vehicleSizeFactor: sizeFactorForRecord(size, t.anySized),
    anfahrt: t.anfahrt,
    mobilPkg: t.mobilPkg,
  };
}

/**
 * Is this date (and, for multi-day, the whole span) allowed for this cart?
 * - inside the booking window (today .. today + HORIZON_DAYS), never in the past
 * - multi-day starts on a future Monday–Friday, not today (the page offers no other start day)
 * - a seasonal package (`until`, the Winterpaket) never runs past its last day
 * - a same-day slot today does not start in the past
 */
export function dateCheck({ date, time, duration, items }, now = new Date()) {
  if (!inBookingWindow(date, now)) return 'invalid';
  const today = viennaToday(now);
  const lastDay = duration.multiDay ? spanEnd(date, duration.spanDays) : date;
  for (const i of items) if (i.until && lastDay > i.until) return 'invalid';
  if (duration.multiDay) {
    // multiDayStartState(): a future working day, never today (TOO_SOON), Monday–Friday
    const w = weekdayOf(date);
    if (w < 1 || w > 5) return 'invalid';
    return date > today ? 'ok' : 'passed';
  }
  if (date < today) return 'passed';                    // the window's slack is for availability only
  if (date === today) {
    const [h, m] = String(time).split(':').map(Number);
    if (h * 60 + m < viennaNowMin(now)) return 'passed';
  }
  return 'ok';
}

/**
 * 'passed' is kept apart from 'invalid' (review 2026-11-13): a real customer can pick today 13:00
 * at 12:29, add photos and press send at 13:01. That is answered like a taken slot (409), which
 * the page already handles — back to the calendar with fresh data — instead of a dead-end error.
 */
export function dateAllowed(args, now = new Date()) {
  return dateCheck(args, now) === 'ok';
}

// ─── free text that lands in the owner's calendar and mailbox ────────────────

/**
 * Customer free text (name, notes, address) is shown to the owner in Google Calendar and Gmail,
 * which turn links into clickable ones. Nobody needs a link in a booking note; a fake
 * „Anzahlung an: https://…" would look like part of the shop's own record. So links are
 * defanged (still readable, no longer clickable) and angle brackets dropped.
 */
export function defangText(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/[<>]/g, '')
    .replace(/\b(https?|ftp):\/\//gi, '$1[:]//')
    .replace(/\bwww\./gi, 'www[.]');
}
