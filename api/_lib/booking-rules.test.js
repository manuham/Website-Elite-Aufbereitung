import { describe, it, expect } from 'vitest';
import {
  viennaToday, viennaNowMin, addDaysIso, spanEnd, inBookingWindow,
  itemForId, rebuildCart, dateAllowed, defangText, HORIZON_DAYS,
} from './booking-rules.js';
import { validateBooking } from '../book.js';

// Friday 13 November 2026, 10:00 in Vienna (CET = UTC+1).
const NOW = new Date('2026-11-13T09:00:00Z');

/** A request body exactly as site/booking.js submit() builds it. */
function body(over = {}) {
  return {
    date: '2026-11-17',
    time: '09:00',
    services: [{ id: 'handwaesche-1', name: 'x', price: 'x', priceNum: 1 }],
    contact: { name: 'Anna Muster', phone: '+43 664 1234567', email: 'anna@example.at', address: '', notes: '' },
    website: '',
    serviceMode: 'studio',
    location: 'Ketschelenstraße 1, 6800 Feldkirch',
    vehicleCategory: 'Kompaktklasse',
    vehicleSizeFactor: 'x',
    mobileSurcharge: 0,
    mobilePackageSurcharge: 0,
    totalStr: 'ab €1,-',
    photoUrls: [],
    durationMin: 90,
    multiDay: false,
    spanDays: null,
    ...over,
  };
}

describe('dates in Vienna', () => {
  it('today and the clock', () => {
    expect(viennaToday(NOW)).toBe('2026-11-13');
    expect(viennaNowMin(NOW)).toBe(600);
    // 23:30 UTC on the 13th is already the 14th in Vienna
    expect(viennaToday(new Date('2026-11-13T23:30:00Z'))).toBe('2026-11-14');
  });
  it('addDaysIso crosses months', () => {
    expect(addDaysIso('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysIso('2026-11-13', -1)).toBe('2026-11-12');
  });
  it('spanEnd skips the weekend like workingSpan()', () => {
    expect(spanEnd('2026-11-13', 1)).toBe('2026-11-13'); // Fri
    expect(spanEnd('2026-11-13', 2)).toBe('2026-11-16'); // Fri + Mon
    expect(spanEnd('2026-11-16', 5)).toBe('2026-11-20');
  });
  it('the booking window is today .. today + HORIZON_DAYS (one day slack each side)', () => {
    expect(inBookingWindow('2026-11-13', NOW)).toBe(true);
    expect(inBookingWindow('2026-11-12', NOW)).toBe(true);
    expect(inBookingWindow('2026-11-11', NOW)).toBe(false);
    expect(inBookingWindow(addDaysIso('2026-11-13', HORIZON_DAYS), NOW)).toBe(true);
    expect(inBookingWindow(addDaysIso('2026-11-13', HORIZON_DAYS + 1), NOW)).toBe(false);
    expect(inBookingWindow('2030-01-01', NOW)).toBe(false);
    expect(inBookingWindow('2026-1-1', NOW)).toBe(false);
  });
});

describe('the cart is rebuilt from IDs', () => {
  it('resolves packages and services, refuses unknown ids', () => {
    expect(itemForId('tier-winter').priceNum).toBe(340);
    expect(itemForId('handwaesche-1').name).toBe('Premium Handwäsche');
    expect(itemForId('handwaesche-999')).toBeNull();
    expect(itemForId('tier-nope')).toBeNull();
    expect(itemForId({})).toBeNull();
  });
  it('prices follow the vehicle class, not the request', () => {
    const c = rebuildCart(['handwaesche-1'], 'Kompaktklasse', 'studio');
    expect(c.ok).toBe(true);
    expect(c.lines[0]).toMatchObject({ name: 'Premium Handwäsche', priceNum: 180, price: 'ab €180,-' }); // 155 × 1,15 → 178,25 → 180
    expect(c.totalStr).toBe('ab €180,-');
    expect(c.duration).toEqual({ multiDay: false, durationMin: 90, spanDays: null });
  });
  it('multi-day spans come from the data', () => {
    const c = rebuildCart(['zusatz-13', 'lenkrad-0'], 'SUV / Van', 'studio');
    expect(c.duration).toEqual({ multiDay: true, spanDays: 2, durationMin: null });
  });
  it('refuses a missing or unknown vehicle class and empty carts', () => {
    expect(rebuildCart(['handwaesche-1'], 'Panzer', 'studio').ok).toBe(false);
    expect(rebuildCart([], 'Kompaktklasse', 'studio').ok).toBe(false);
    expect(rebuildCart(['x-1'], 'Kompaktklasse', 'studio').ok).toBe(false);
  });
  it('a duplicated id counts once', () => {
    const c = rebuildCart(['handwaesche-1', 'handwaesche-1'], 'Kleinwagen', 'studio');
    expect(c.lines).toHaveLength(1);
  });
  it('mobil adds the Anfahrt and the package surcharge', () => {
    const c = rebuildCart(['tier-silber'], 'Kleinwagen', 'mobil');
    expect(c.anfahrt).toBe(70);
    expect(c.mobilPkg).toBe(45);
    expect(c.totalStr).toBe('ab €735,-');
  });
});

describe('review 2026-11-13: id, date and slot edge cases', () => {
  it('zero-padded and other non-canonical ids are refused', () => {
    expect(itemForId('keramik-01')).toBeNull();
    expect(itemForId('handwaesche-1 ')).toBeNull();
    expect(itemForId('__proto__-0')).toBeNull();
    expect(itemForId('constructor-0')).toBeNull();
    expect(itemForId('handwaesche-1e0')).toBeNull();
  });
  it('phoneOnly packages and services can not be booked online', () => {
    for (const id of ['tier-gold', 'tier-elite', 'politur-1', 'keramik-0', 'keramik-1', 'keramik-2']) {
      expect(itemForId(id), id).toBeNull();
    }
  });
  it('impossible calendar days are refused', () => {
    for (const d of ['2026-11-31', '2026-12-99', '2026-12-00', '2026-13-01', '2027-02-29']) {
      expect(inBookingWindow(d, NOW), d).toBe(false);
    }
  });
  it('a slot that passed while the customer typed is "passed", not invalid (→ 409 slot_taken)', () => {
    expect(validateBooking(body({ date: '2026-11-13', time: '09:30' }), NOW)).toEqual({ ok: false, passed: true });
    expect(validateBooking(body({ date: '2026-11-11' }), NOW)).toEqual({ ok: false });
  });
});

describe('dateAllowed', () => {
  const same = (min) => ({ multiDay: false, durationMin: min, spanDays: null });
  const multi = (n) => ({ multiDay: true, durationMin: null, spanDays: n });
  it('same-day today only from now on', () => {
    expect(dateAllowed({ date: '2026-11-13', time: '09:00', duration: same(60), items: [] }, NOW)).toBe(false);
    expect(dateAllowed({ date: '2026-11-13', time: '11:00', duration: same(60), items: [] }, NOW)).toBe(true);
  });
  it('multi-day starts on a future Monday to Friday only', () => {
    expect(dateAllowed({ date: '2026-11-14', duration: multi(2), items: [] }, NOW)).toBe(false); // Sat
    expect(dateAllowed({ date: '2026-11-13', duration: multi(2), items: [] }, NOW)).toBe(false); // today (Fri)
    expect(dateAllowed({ date: '2026-11-16', duration: multi(2), items: [] }, NOW)).toBe(true);
  });
  it('yesterday is refused even though the availability window allows it', () => {
    expect(dateAllowed({ date: '2026-11-12', time: '12:00', duration: same(60), items: [] }, NOW)).toBe(false);
  });
  it('the Winterpaket never runs past 20 December', () => {
    const items = [itemForId('tier-winter')];
    expect(dateAllowed({ date: '2026-12-19', time: '09:00', duration: same(240), items }, NOW)).toBe(true);
    expect(dateAllowed({ date: '2026-12-21', time: '09:00', duration: same(240), items }, NOW)).toBe(false);
  });
});

describe('defangText', () => {
  it('keeps links readable but not clickable, drops angle brackets', () => {
    expect(defangText('Anzahlung an https://evil.example/pay')).toBe('Anzahlung an https[:]//evil.example/pay');
    expect(defangText('siehe www.evil.example')).toBe('siehe www[.]evil.example');
    expect(defangText('<b>hi</b>')).toBe('bhi/b');
    expect(defangText('Bitte Hintereingang, Tor 3')).toBe('Bitte Hintereingang, Tor 3');
  });
});

describe('validateBooking (the request the page sends)', () => {
  it('accepts what the page sends and overrides every number', () => {
    const r = validateBooking(body(), NOW);
    expect(r.ok).toBe(true);
    expect(r.data.services).toEqual([{ id: 'handwaesche-1', name: 'Premium Handwäsche', priceNum: 180, price: 'ab €180,-' }]);
    expect(r.data.totalStr).toBe('ab €180,-');
    expect(r.data.vehicleSizeFactor).toBe('×1,15 (Kompaktklasse)');
    expect(r.data.durationMin).toBe(90);
  });
  it('the attack from the review: a 30-day span on a same-day cart is refused', () => {
    expect(validateBooking(body({ multiDay: true, spanDays: 30, time: null }), NOW).ok).toBe(false);
  });
  it('a real multi-day cart still books, with the span from the data', () => {
    const r = validateBooking(body({ services: [{ id: 'zusatz-13' }, { id: 'lenkrad-0' }], multiDay: true, spanDays: 30, time: null, durationMin: null, date: '2026-11-16' }), NOW);
    expect(r.ok).toBe(true);
    expect(r.data.spanDays).toBe(2);
  });
  it('past, far-future and unknown-service bookings are refused', () => {
    expect(validateBooking(body({ date: '2026-11-01' }), NOW).ok).toBe(false);
    expect(validateBooking(body({ date: '2027-06-01' }), NOW).ok).toBe(false);
    expect(validateBooking(body({ services: [{ id: 'fake-1', name: 'Gratis', priceNum: 1 }] }), NOW).ok).toBe(false);
  });
  it('a studio booking must name one of the two studios', () => {
    expect(validateBooking(body({ location: 'https://evil.example' }), NOW).ok).toBe(false);
    expect(validateBooking(body({ location: 'Bundesstraße 2a, 6714 Nüziders' }), NOW).ok).toBe(true);
  });
  it('mobil uses the customer address as the location, defanged', () => {
    const r = validateBooking(body({
      serviceMode: 'mobil', location: 'ignored',
      contact: { name: 'Anna', phone: '+43 664 1234567', email: 'anna@example.at', address: 'Hauptstraße 1, 6800 Feldkirch www.x.at', notes: 'Zahlung an https://evil.example' },
    }), NOW);
    expect(r.ok).toBe(true);
    expect(r.data.location).toBe('Hauptstraße 1, 6800 Feldkirch www[.]x.at');
    expect(r.data.contact.notes).toBe('Zahlung an https[:]//evil.example');
    expect(r.data.mobileSurcharge).toBe(70);
  });
});
