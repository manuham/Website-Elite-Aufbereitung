import { describe, it, expect } from 'vitest';
import {
  DAY, HORIZON_DAYS, WORKDAY_MIN, MULTIDAY_TOLERANCE_MIN,
  addDays, isoKey, workingSpan, startOfDay,
  makeAvailability, dayStatus, multiDayStartState, multiDayStartFree,
  sameDayPlan, freeStartCount, computeBookingDuration, multiDayTerms,
  availableDays,
} from './scheduling';

// 2026-07-20 Mo · 07-24 Fr · 07-25 Sa · 07-26 So · 07-27 Mo · 07-28 Di
const MON = new Date(2026, 6, 20);
const TUE = new Date(2026, 6, 21);
const FRI = new Date(2026, 6, 24);
const SAT = new Date(2026, 6, 25);
const SUN = new Date(2026, 6, 26);

const at = (d, h, m = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
const SAME = { multiDay: false, durationMin: 90, spanDays: null };
const MULTI = (n) => ({ multiDay: true, durationMin: null, spanDays: n });

/** n consecutive days from `from`, all fetched and all empty. */
const week = (from, n = 7) =>
  Object.fromEntries(Array.from({ length: n }, (_, i) => [isoKey(addDays(from, i)), []]));

// ── A. Unknown ≠ free — the whole point ─────────────────────────────────────
describe('coverage: unknown is not free', () => {
  it('reports an unfetched open day as UNKNOWN, not FREE', () => {
    expect(dayStatus(TUE, SAME, makeAvailability({}), at(MON, 9)).status).toBe(DAY.UNKNOWN);
  });

  it('reports a fetched-and-empty day as FREE', () => {
    const avail = makeAvailability({ [isoKey(TUE)]: [] });
    expect(dayStatus(TUE, SAME, avail, at(MON, 9)).status).toBe(DAY.FREE);
  });

  it('distinguishes fetched-and-empty from never-fetched at the busy() level', () => {
    const avail = makeAvailability({ [isoKey(TUE)]: [] });
    expect(avail.busy(TUE)).toEqual([]);      // known, nothing booked
    expect(avail.busy(FRI)).toBeNull();       // never fetched
    expect(avail.isKnown(TUE)).toBe(true);
    expect(avail.isKnown(FRI)).toBe(false);
  });

  it('packs nothing for an unknown day rather than inventing a wide-open one', () => {
    const p = sameDayPlan(TUE, 90, null, at(MON, 9));
    expect(p.unknown).toBe(true);
    expect(p.free).toEqual([]);
    expect(freeStartCount(TUE, 90, null, at(MON, 9))).toBe(0);
  });
});

// ── C. A fallback skeleton is not knowledge ─────────────────────────────────
describe('coverage: fallback:true is not knowledge', () => {
  it('marks every day of an untrusted map UNKNOWN, never FREE', () => {
    const avail = makeAvailability(week(MON, 14), { trusted: false });
    expect(avail.isKnown(TUE)).toBe(false);
    expect(avail.busy(TUE)).toBeNull();
    expect(dayStatus(TUE, SAME, avail, at(MON, 9)).status).toBe(DAY.UNKNOWN);
  });

  it('refuses a multi-day span built only from fallback data', () => {
    const avail = makeAvailability(week(MON, 14), { trusted: false });
    expect(multiDayStartState(TUE, 3, avail, at(MON, 9))).toBe(DAY.UNKNOWN);
    expect(multiDayStartFree(TUE, 3, avail, at(MON, 9))).toBe(false);
  });
});

// ── D. Closed days must not fragment a scan ─────────────────────────────────
describe('coverage: structural rules need no data', () => {
  it('calls an unfetched Sunday CLOSED, not UNKNOWN', () => {
    expect(dayStatus(SUN, SAME, makeAvailability({}), at(MON, 9)).status).toBe(DAY.CLOSED);
  });

  it('calls an unfetched past day PAST, not UNKNOWN', () => {
    expect(dayStatus(MON, SAME, makeAvailability({}), at(TUE, 9)).status).toBe(DAY.PAST);
  });

  it("calls today PAST once the clock has run past the last start that could fit", () => {
    // 17:00 + 30 buffer → earliest 17:30; a 90-min job cannot start before 18:00 close
    expect(dayStatus(MON, SAME, makeAvailability(week(MON)), at(MON, 17)).status).toBe(DAY.PAST);
  });
});

// ── E. The live multi-day bug — pin it ──────────────────────────────────────
describe('multi-day drop-off', () => {
  it('will not call a Friday drop-off free when next week was never fetched', () => {
    // span reaches Mon 27 + Tue 28, which a Mon–Sun fetch never covered
    const avail = makeAvailability(week(MON));
    expect(dayStatus(FRI, MULTI(3), avail, at(MON, 9)).status).toBe(DAY.UNKNOWN);
    expect(multiDayStartFree(FRI, 3, avail, at(MON, 9))).toBe(false);
  });

  it('calls the same Friday FREE once the span days are actually loaded', () => {
    const avail = makeAvailability(week(MON, 14));
    expect(dayStatus(FRI, MULTI(3), avail, at(MON, 9)).status).toBe(DAY.FREE);
  });

  it('tolerates a short event on a span day but a long one blocks the drop-off', () => {
    // A 15-min errand on Tuesday no longer kills a Friday→(Fri,Mon,Tue) drop-off …
    const short = makeAvailability({ ...week(MON, 14), '2026-07-28': [[600, 615]] });
    expect(dayStatus(FRI, MULTI(3), short, at(MON, 9)).status).toBe(DAY.FREE);
    // … but a 6-hour booking does.
    const long = makeAvailability({ ...week(MON, 14), '2026-07-28': [[540, 900]] });
    expect(dayStatus(FRI, MULTI(3), long, at(MON, 9)).status).toBe(DAY.FULL);
  });

  it('the tolerance is a boundary: exactly MULTIDAY_TOLERANCE_MIN passes, one minute more blocks', () => {
    const ok = makeAvailability({ ...week(MON, 14), '2026-07-28': [[600, 600 + MULTIDAY_TOLERANCE_MIN]] });
    const over = makeAvailability({ ...week(MON, 14), '2026-07-28': [[600, 601 + MULTIDAY_TOLERANCE_MIN]] });
    expect(dayStatus(FRI, MULTI(3), ok, at(MON, 9)).status).toBe(DAY.FREE);
    expect(dayStatus(FRI, MULTI(3), over, at(MON, 9)).status).toBe(DAY.FULL);
  });

  it('sums multiple short events — several small blocks can still exceed the tolerance', () => {
    // 3 × 40 min = 120 > 90, even though no single one would block.
    const avail = makeAvailability({ ...week(MON, 14), '2026-07-28': [[540, 580], [660, 700], [780, 820]] });
    expect(dayStatus(FRI, MULTI(3), avail, at(MON, 9)).status).toBe(DAY.FULL);
  });

  it('lets a definite FULL outrank a coverage gap', () => {
    // Tue 28 is booked solid AND the rest of the span is unfetched → FULL, not UNKNOWN:
    // the span is unbookable either way, and FULL is the more useful answer.
    const avail = makeAvailability({ ...week(MON), '2026-07-28': [[480, 1080]] });
    expect(dayStatus(FRI, MULTI(3), avail, at(MON, 9)).status).toBe(DAY.FULL);
  });

  it('cannot start today, and never on Sa/So', () => {
    const avail = makeAvailability(week(MON, 14));
    expect(dayStatus(MON, MULTI(2), avail, at(MON, 7)).status).toBe(DAY.TOO_SOON);
    expect(dayStatus(SAT, MULTI(2), avail, at(MON, 7)).status).toBe(DAY.CLOSED);
    expect(dayStatus(SUN, MULTI(2), avail, at(MON, 7)).status).toBe(DAY.CLOSED);
  });

  it('returns the span on a FREE day and nothing on a blocked one', () => {
    const avail = makeAvailability(week(MON, 14));
    expect(dayStatus(TUE, MULTI(3), avail, at(MON, 9)).span.map(isoKey))
      .toEqual(['2026-07-21', '2026-07-22', '2026-07-23']);
    expect(dayStatus(SAT, MULTI(3), avail, at(MON, 9)).span).toBeNull();
  });

  it('workingSpan skips weekends', () => {
    expect(workingSpan(FRI, 3).map(isoKey)).toEqual(['2026-07-24', '2026-07-27', '2026-07-28']);
  });
});

// ── F. sameDayPlan — zero coverage before this file ─────────────────────────
describe('sameDayPlan packing', () => {
  it('packs duration+BUFFER around a busy interval', () => {
    // busy 10:00–11:00 → blocked 09:30–11:30 → gaps [08:00,09:30] + [11:30,18:00]
    expect(sameDayPlan(MON, 90, [[600, 660]], at(MON, 6)).free.map((f) => f.start))
      .toEqual([480, 690, 810, 930]);
  });

  it('the flagship 300-min service yields exactly ONE start on an empty weekday', () => {
    expect(sameDayPlan(MON, 300, [], at(MON, 6)).free.map((f) => f.start)).toEqual([480]);
  });

  it('… and a 10:00 booking MOVES that one start to 11:30, it does not remove it', () => {
    expect(sameDayPlan(MON, 300, [[600, 660]], at(MON, 6)).free).toEqual([{ start: 690, end: 990 }]);
  });

  it('a 360-min service can never fit Saturday (08:00+360 = 840 > close 780)', () => {
    expect(sameDayPlan(SAT, 360, [], at(MON, 7)).free).toEqual([]);
    expect(sameDayPlan(SAT, 300, [], at(MON, 7)).free.map((f) => f.start)).toEqual([480]);
  });

  it('reports Sunday closed at any duration', () => {
    expect(sameDayPlan(SUN, 30, [], at(MON, 7)).closed).toBe(true);
  });

  it("rounds today's earliest start up to the next :30 past now+BUFFER", () => {
    const p = sameDayPlan(MON, 90, [], at(MON, 9, 5));   // 09:05 + 30 → ceil → 10:00
    expect(p.free[0].start).toBe(600);
    expect(p.past).toEqual([480, 600]);
  });

  it('does not hang on a zero/null duration', () => {
    expect(sameDayPlan(MON, 0, [], at(MON, 7)).free).toEqual([]);
    expect(sameDayPlan(MON, null, [], at(MON, 7)).free).toEqual([]);
  });
});

// ── G. computeBookingDuration — pin the flip table against the real services ─
describe('computeBookingDuration', () => {
  const svc = (o) => ({ durationMin: null, durationDays: null, mobilExtraMin: 0, ...o });

  it('keeps a same-day combo under one workday same-day', () => {
    // Verkaufsaufbereitung 360 + Scheinwerfer 180 = 540 ≤ WORKDAY_MIN
    expect(computeBookingDuration([svc({ durationMin: 360 }), svc({ durationMin: 180 })], 'studio'))
      .toEqual({ multiDay: false, durationMin: 540, spanDays: null });
  });

  it('flips to multi-day when same-day work exceeds one workday', () => {
    // Bronze 300 + Leichte Politur 360 = 660 > 600 → ceil(660/600) = 2
    expect(computeBookingDuration([svc({ durationMin: 300 }), svc({ durationMin: 360 })], 'studio'))
      .toEqual({ multiDay: true, spanDays: 2, durationMin: null });
  });

  it('treats any durationDays item as multi-day', () => {
    // Silber – Deep Clean alone
    expect(computeBookingDuration([svc({ durationDays: 1 })], 'studio'))
      .toEqual({ multiDay: true, spanDays: 1, durationMin: null });
    // Silber + Kunststoffteile beschichten
    expect(computeBookingDuration([svc({ durationDays: 1 }), svc({ durationDays: 1 })], 'studio'))
      .toEqual({ multiDay: true, spanDays: 2, durationMin: null });
  });

  it('adds mobil travel time to the same-day slot but not to the day count', () => {
    expect(computeBookingDuration([svc({ durationMin: 300, mobilExtraMin: 60 })], 'mobil'))
      .toEqual({ multiDay: false, durationMin: 360, spanDays: null });
    // 600 work + 60 travel: travel must not push the span to 2
    expect(computeBookingDuration([svc({ durationMin: 600, mobilExtraMin: 60 })], 'mobil'))
      .toEqual({ multiDay: true, spanDays: 1, durationMin: null });
  });

  it('handles an empty cart without inventing a booking', () => {
    expect(computeBookingDuration([], 'studio'))
      .toEqual({ multiDay: false, durationMin: 0, spanDays: null });
  });

  it('WORKDAY_MIN is the flip threshold', () => {
    expect(computeBookingDuration([svc({ durationMin: WORKDAY_MIN })], 'studio').multiDay).toBe(false);
    expect(computeBookingDuration([svc({ durationMin: WORKDAY_MIN + 1 })], 'studio').multiDay).toBe(true);
  });
});

// ── H. DST — the EU switch always lands on the closed day ───────────────────
describe('DST', () => {
  it('addDays crosses the spring-forward Sunday without rolling back', () => {
    // a `+ 86400000` "optimisation" silently returns the 28th here
    expect(isoKey(addDays(new Date(2026, 2, 28, 12), 1))).toBe('2026-03-29');
    expect(isoKey(addDays(new Date(2026, 9, 24, 12), 1))).toBe('2026-10-25');
  });

  it('workingSpan crosses spring-forward correctly', () => {
    // Fri 2026-03-27 → skips Sa 28 + So 29 (the switch)
    expect(workingSpan(new Date(2026, 2, 27), 3).map(isoKey))
      .toEqual(['2026-03-27', '2026-03-30', '2026-03-31']);
  });

  it('a 10-day scan across the switch yields 10 distinct days, none skipped or repeated', () => {
    const from = new Date(2026, 2, 25);
    const keys = Array.from({ length: 10 }, (_, i) => isoKey(addDays(from, i)));
    expect(new Set(keys).size).toBe(10);
    expect(keys[0]).toBe('2026-03-25');
    expect(keys[9]).toBe('2026-04-03');
  });
});

// ── J. Drift guards ─────────────────────────────────────────────────────────
describe('drift guards', () => {
  it('HORIZON_DAYS matches the clamp in api/availability.js', async () => {
    // The two files share no import; this is the only thing holding them together.
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../../api/availability.js', import.meta.url), 'utf8'));
    const clamp = src.match(/parseInt\(req\.query\.days, 10\) \|\| 1, 1\), (\d+)\)/);
    expect(clamp, 'could not find the days clamp in api/availability.js').not.toBeNull();
    expect(Number(clamp[1])).toBe(HORIZON_DAYS);
  });

  it('MULTIDAY_TOLERANCE_MIN matches the server mirror in api/_lib/calendar.js', async () => {
    // The client offers a multi-day drop-off exactly when the server would accept it; if these
    // drift, the rail advertises a day and api/book 409s it.
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../../api/_lib/calendar.js', import.meta.url), 'utf8'));
    const m = src.match(/MULTIDAY_TOLERANCE_MIN\s*=\s*(\d+)/);
    expect(m, 'could not find MULTIDAY_TOLERANCE_MIN in api/_lib/calendar.js').not.toBeNull();
    expect(Number(m[1])).toBe(MULTIDAY_TOLERANCE_MIN);
  });
});

// ── availableDays / grouping — the rail's data ──────────────────────────────
describe('availableDays', () => {
  // Mon 20 06:00 — before open, so the whole week is future and bookable.
  const NOW = at(MON, 6);
  const WED = new Date(2026, 6, 22);
  const MON27 = new Date(2026, 6, 27);
  const FULL_WD = [[480, 1080]];   // a booked-solid weekday
  const FULL_SA = [[480, 780]];    // a booked-solid Saturday

  // Mon free · Tue full · Wed free · Thu/Fri/Sat full · Sun closed · Mon(next) free
  const sparse = () => ({
    ...week(MON, 14),
    '2026-07-21': FULL_WD, '2026-07-23': FULL_WD, '2026-07-24': FULL_WD, '2026-07-25': FULL_SA,
  });

  it('collects only the bookable days, in order', () => {
    const r = availableDays(MON, SAME, makeAvailability(sparse()), NOW, 8);   // Mon 20 → Mon 27
    expect(r.count).toBe(3);
    expect(r.items.filter((i) => i.kind === 'day').map((i) => i.iso))
      .toEqual(['2026-07-20', '2026-07-22', '2026-07-27']);
    expect(r.truncated).toBe(false);
    expect(r.exhausted).toBe(false);
  });

  it('emits a gap marker between free days that skips a genuine no-fit run', () => {
    const r = availableDays(MON, SAME, makeAvailability(sparse()), NOW, 8);
    const gaps = r.items.filter((i) => i.kind === 'gap');
    expect(gaps).toHaveLength(2);
    expect(isoKey(gaps[0].from)).toBe('2026-07-21');                  // Tue only
    expect([isoKey(gaps[1].from), isoKey(gaps[1].to)]).toEqual(['2026-07-23', '2026-07-26']); // Thu–Sun
  });

  it('does NOT emit a gap for a weekend-only skip (a closed Sunday is not news)', () => {
    const SAT = new Date(2026, 6, 25);
    const map = { [isoKey(SAT)]: [], [isoKey(MON27)]: [] };   // Sat free, Sun closed (no data), Mon free
    const r = availableDays(SAT, SAME, makeAvailability(map), at(MON, 6));
    expect(r.count).toBe(2);
    expect(r.items.some((i) => i.kind === 'gap')).toBe(false);
  });

  it('never emits a leading or trailing gap', () => {
    // Tue full (leading, before any free day), then Wed free, then Thu full (trailing).
    const map = { '2026-07-21': FULL_WD, [isoKey(WED)]: [], '2026-07-23': FULL_WD };
    const r = availableDays(new Date(2026, 6, 21), SAME, makeAvailability(map), NOW);
    expect(r.items.map((i) => i.kind)).toEqual(['day']);   // just Wed, no gaps around it
  });

  it('stops at the first UNKNOWN and reports truncated, not exhausted', () => {
    // Only Monday is known (and free); Tuesday onward was never fetched.
    const r = availableDays(MON, SAME, makeAvailability({ [isoKey(MON)]: [] }), NOW);
    expect(r.count).toBe(1);
    expect(r.truncated).toBe(true);
    expect(r.exhausted).toBe(false);
    expect(isoKey(r.knownThrough)).toBe('2026-07-20');
  });

  it('reports exhausted when the whole horizon is known and nothing fits', () => {
    const allFull = Object.fromEntries(
      Array.from({ length: HORIZON_DAYS }, (_, i) => [isoKey(addDays(MON, i)), FULL_WD]));
    const r = availableDays(MON, SAME, makeAvailability(allFull), NOW, HORIZON_DAYS);
    expect(r.count).toBe(0);
    expect(r.exhausted).toBe(true);
    expect(r.truncated).toBe(false);
    expect(isoKey(r.until)).toBe(isoKey(addDays(MON, HORIZON_DAYS - 1)));
  });

  it('a fallback (untrusted) horizon is truncated, never a wall of free days', () => {
    const r = availableDays(MON, SAME, makeAvailability(week(MON, 14), { trusted: false }), NOW);
    expect(r.count).toBe(0);
    expect(r.truncated).toBe(true);
    expect(r.exhausted).toBe(false);
  });
});

// ── multiDayTerms — the single source of truth for multi-day wording ────────
describe('multiDayTerms', () => {
  it('supplies studio and mobil wording including the plural', () => {
    expect(multiDayTerms('studio').chooseDay).toBe('Abgabetag');
    expect(multiDayTerms('studio').chooseDayPlural).toBe('Abgabetage');
    expect(multiDayTerms('mobil').chooseDay).toBe('Starttag');
    expect(multiDayTerms('mobil').chooseDayPlural).toBe('Starttage');
  });
});
