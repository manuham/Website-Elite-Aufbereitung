/* ─── Booking calendar · scheduling utilities ────────────────────────────────
   Pure, framework-free helpers for the duration-aware week view.
   Rules ported from the design prototype (calendar-data.js) — NO mock data;
   busy intervals come from the real availability API.

   Two booking shapes:
     • same-day  → variable-height time blocks packed around busy intervals
     • multi-day → drop-off day + working-day span the car stays in the studio
-----------------------------------------------------------------------------*/

export const DAYS_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const DAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// Working hours in minutes from midnight. null = closed.
export const HOURS = {
  0: null,          // So — geschlossen
  1: [480, 1080],   // Mo 08:00–18:00
  2: [480, 1080],
  3: [480, 1080],
  4: [480, 1080],
  5: [480, 1080],
  6: [480, 780],    // Sa 08:00–13:00
};
export const BUFFER = 30;          // min between two jobs
export const AXIS_START = 480;     // grid top 08:00
export const AXIS_END = 1080;      // grid bottom 18:00
export const WORKDAY_MIN = 600;    // bookable minutes in a full weekday (Mo–Fr 08:00–18:00)
export const DROPOFF_BY = '09:00'; // multi-day drop-off
export const PICKUP_FROM = '16:00'; // multi-day pickup (last day)

// ── date helpers ──────────────────────────────────────────────────────────
export function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function sameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
export function isoKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
export function minToTime(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
export function timeToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
export function isWorkingDay(d) { return HOURS[d.getDay()] != null; }
/** Multi-day drop-off/pickup runs on full weekdays only (Mo–Fr). Saturday's short hours (08–13)
 *  can't host a 09:00 drop-off → 16:00 pickup, so it is excluded from multi-day spans. */
export function isMultiDayDay(d) { const w = d.getDay(); return w >= 1 && w <= 5; }

/** Monday of the week containing `date`. */
export function weekStartMonday(date) {
  const d = startOfDay(date);
  const dow = d.getDay();            // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow; // back to Monday
  return addDays(d, diff);
}
/** 7-day Monday→Sunday array for the week containing `date`. */
export function weekDays(date) {
  const mon = weekStartMonday(date);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

// ── labels ────────────────────────────────────────────────────────────────
export function durLabel(min) {
  if (min < 60) return `${min} Min`;
  const h = min / 60;
  return (Number.isInteger(h) ? `${h}` : h.toString().replace('.', ',')) + ' Std';
}
export function daysLabel(days) {
  return (Number.isInteger(days) ? `${days}` : days.toString().replace('.', ',')) + (days === 1 ? ' Tag' : ' Tage');
}
export function germanFull(d) { return `${DAYS_FULL[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`; }

/**
 * Wording for the multi-day span differs by service mode (single source of truth for all surfaces):
 *   • studio → the car is dropped off (bis 09:00) and picked up (ab 16:00).
 *   • mobil  → the team starts on-site (ab 09:00) and finishes (bis 16:00); no studio hand-off.
 */
export function multiDayTerms(serviceMode) {
  const mobil = serviceMode === 'mobil';
  // "…{days}…" split so the day count can be rendered bold in JSX (stayPrefix/staySuffix) or
  // as a plain string (stay()).
  const stayPrefix = mobil ? 'Wir sind ' : 'Ihr Fahrzeug bleibt ';
  const staySuffix = mobil ? ' bei Ihnen vor Ort' : ' im Studio';
  return {
    start: mobil ? 'Beginn' : 'Abgabe',
    end: mobil ? 'Fertigstellung' : 'Abholung',
    startTime: mobil ? `ab ${DROPOFF_BY}` : `bis ${DROPOFF_BY}`,
    endTime: mobil ? `bis ${PICKUP_FROM}` : `ab ${PICKUP_FROM}`,
    chooseDay: mobil ? 'Starttag' : 'Abgabetag',
    stayPrefix,
    staySuffix,
    stay: (days) => `${stayPrefix}${days}${staySuffix}`,
    bandStart: mobil ? 'START' : 'ABGABE',
    bandEnd: mobil ? 'FERTIG' : 'ABHOLUNG',
    bandMid: mobil ? 'vor Ort' : 'im Studio',
  };
}

// ── duration aggregation across the Step-1 cart ─────────────────────────────
/**
 * Combine the durations of all selected services into one effective booking
 * duration. Any multi-day item makes the whole booking multi-day (span = sum of
 * the multi-day items' days, rounded up). Otherwise the same-day minutes are
 * summed, plus mobil extra time when the booking is mobil.
 * @returns {{ multiDay: boolean, durationMin: number|null, spanDays: number|null }}
 */
export function computeBookingDuration(selectedItems, serviceMode) {
  const items = selectedItems || [];
  const workMin = items.reduce((s, i) => s + (i.durationMin || 0), 0);   // same-day service minutes
  const mobilTravel = serviceMode === 'mobil'                            // one-off mobil setup/travel time
    ? items.reduce((s, i) => s + (i.mobilExtraMin || 0), 0) : 0;
  const slotMin = workMin + mobilTravel;                                 // same-day slot to reserve
  const multiDays = items.filter(i => i.durationDays != null).reduce((s, i) => s + i.durationDays, 0);

  // Multi-day when any item is multi-day OR the same-day slot can't fit one working day.
  // The span folds in same-day WORK only (÷ WORKDAY_MIN) — travel time doesn't add whole days — so
  // the studio calendar is never under-blocked and an over-long same-day combo can't leave the user
  // stuck on an all-blocked calendar (it spills into a drop-off span instead).
  if (multiDays > 0 || slotMin > WORKDAY_MIN) {
    const spanDays = Math.max(1, Math.ceil(multiDays + workMin / WORKDAY_MIN));
    return { multiDay: true, spanDays, durationMin: null };
  }
  return { multiDay: false, durationMin: slotMin, spanDays: null };
}

// ── same-day packing ────────────────────────────────────────────────────────
/**
 * Compute the same-day plan for a given duration.
 * @param date  Date of the column
 * @param durMin  effective duration in minutes
 * @param busy  array of [startMin, endMin] busy intervals for that day
 * @param now   "current" Date (for past shading / earliest start)
 * @returns { closed, fullyPast, busy, free:[{start,end}], past:[s,e]|null, open, close }
 */
export function sameDayPlan(date, durMin, busy, now) {
  const wh = HOURS[date.getDay()];
  if (!wh) return { closed: true, busy: [], free: [], past: null, open: AXIS_START, close: AXIS_END };
  const [open, close] = wh;
  const today0 = startOfDay(now);
  const base = startOfDay(date);
  const isPast = base < today0;
  const isToday = sameDay(base, today0);

  if (isPast) return { closed: false, fullyPast: true, busy: [], free: [], past: [open, close], open, close };

  const intervals = (busy || []).slice().sort((a, b) => a[0] - b[0]);

  // No (or invalid) duration → nothing to pack. Guards against an infinite loop.
  if (!durMin || durMin <= 0) return { closed: false, busy: intervals, free: [], past: null, open, close };

  // earliest bookable cursor today = round now up to next 30 (+buffer)
  let earliest = open;
  if (isToday) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    earliest = Math.max(open, Math.ceil((nowMin + BUFFER) / 30) * 30);
  }
  const pastRegion = (isToday && earliest > open) ? [open, Math.min(earliest, close)] : null;

  // blocked = busy expanded by buffer, clamped to working hours, merged
  const blocked = intervals
    .map(([s, e]) => [Math.max(open, s - BUFFER), Math.min(close, e + BUFFER)])
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const iv of blocked) {
    const last = merged[merged.length - 1];
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
    else merged.push([...iv]);
  }

  // free gaps within [earliest, close]
  const gaps = [];
  let cursor = earliest;
  for (const [bs, be] of merged) {
    if (bs > cursor) gaps.push([cursor, bs]);
    cursor = Math.max(cursor, be);
  }
  if (cursor < close) gaps.push([cursor, close]);

  const free = [];
  for (const [gs, ge] of gaps) {
    let t = gs;
    while (t + durMin <= ge) {
      free.push({ start: t, end: t + durMin });
      t += durMin + BUFFER;
    }
  }
  return { closed: false, busy: intervals, free, past: pastRegion, open, close };
}

/** Number of free same-day starts for a duration (for the mobile day-pill dots). */
export function freeStartCount(date, durMin, busy, now) {
  const p = sameDayPlan(date, durMin, busy, now);
  return p.closed || p.fullyPast ? 0 : p.free.length;
}

// ── multi-day span ──────────────────────────────────────────────────────────
/** Collect `count` multi-day span days starting at `date` (weekdays Mo–Fr; skips Sat + Sun). */
export function workingSpan(date, count) {
  const out = [];
  let d = startOfDay(date);
  let guard = 0;
  while (out.length < count && guard < 60) {
    if (isMultiDayDay(d)) out.push(new Date(d));
    d = addDays(d, 1);
    guard++;
  }
  return out;
}

/**
 * Whether `date` is a valid multi-day drop-off start: a future working day
 * (not today), where every working day in the span is free of bookings.
 * @param busyByIso  map of isoKey to busy intervals array
 */
export function multiDayStartFree(date, count, busyByIso, now) {
  const base = startOfDay(date);
  const today0 = startOfDay(now);
  if (base < today0 || !isMultiDayDay(base)) return false;
  if (sameDay(base, today0)) return false; // can't start a multi-day job same day
  const span = workingSpan(base, count);
  return span.every(d => {
    const b = busyByIso ? busyByIso[isoKey(d)] : null;
    return !b || b.length === 0;
  });
}
