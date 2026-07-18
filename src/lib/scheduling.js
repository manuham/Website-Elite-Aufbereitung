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

/** Days of availability loaded in one range. MUST equal the clamp in api/availability.js
 *  (the two files share no import; `scheduling.test.js` pins them together). */
export const HORIZON_DAYS = 56;

/**
 * How many booked minutes a multi-day span day may already hold and still accept a drop-off.
 * The car occupies the studio across the span, but a short unrelated errand (a 30-min
 * Textilimprägnierung, a personal appointment on the connected calendar) shouldn't remove a
 * whole drop-off day the way "must be totally empty" did. All-day vacation blocks stay well over
 * this, so they keep blocking. MUST equal MULTIDAY_TOLERANCE_MIN in api/_lib/calendar.js — the
 * server mirrors this rule and a mismatch would 409 a booking the client offered
 * (`scheduling.test.js` pins them together).
 */
export const MULTIDAY_TOLERANCE_MIN = 90;

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
    chooseDayPlural: mobil ? 'Starttage' : 'Abgabetage',
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
 * @param busy  array of [startMin, endMin] busy intervals for that day, or null/undefined when
 *              the day is not covered by loaded data (see makeAvailability)
 * @param now   "current" Date (for past shading / earliest start)
 * @returns { closed, fullyPast, unknown, busy, free:[{start,end}], past:[s,e]|null, open, close }
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

  // Not covered by loaded data (never fetched, or a fallback skeleton). Unknown is NOT free — pack
  // nothing rather than invent a wide-open day. Checked after closed/past so those stay derivable
  // from the rules alone and an unfetched Sunday reports "closed", not "unknown".
  if (busy == null) return { closed: false, unknown: true, busy: [], free: [], past: null, open, close };

  const intervals = busy.slice().sort((a, b) => a[0] - b[0]);

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
  return (p.closed || p.fullyPast || p.unknown) ? 0 : p.free.length;
}

// ── availability coverage: "unknown" is not "free" ──────────────────────────
/**
 * Wrap the raw busy map in something that can say "I have no data for this day".
 *
 * `busyByIso[iso]` missing and `busyByIso[iso] === []` are otherwise indistinguishable under
 * `|| []`: "never fetched" and "fetched, nothing booked" both read as free. That is how a
 * multi-day span reaching past the loaded range got offered without ever being checked — the
 * server then rejects it with a 409 at the end of the funnel.
 *
 * Key presence is the signal: /api/availability writes a key for every day it returns, including
 * closed ones. Nothing below ever infers freedom from absence.
 *
 * @param busyByIso  { 'YYYY-MM-DD': [[startMin,endMin], …] }
 * @param opts.trusted  false when the API returned fallback:true. That response is a fabricated
 *   working-hours skeleton (`busy: []` for every day) built without reaching Google, so every day
 *   in it is unknown — repeating it back as availability would invent appointments out of an outage.
 */
export function makeAvailability(busyByIso, opts = {}) {
  const map = busyByIso || {};
  const { trusted = true } = opts;
  const known = trusted ? new Set(Object.keys(map)) : new Set();
  return {
    known,
    isKnown: (d) => known.has(isoKey(d)),
    busy: (d) => (known.has(isoKey(d)) ? (map[isoKey(d)] || []) : null),   // null ⇒ unknown
  };
}

/** Why a day is or isn't offerable. CLOSED/PAST/TOO_SOON follow from the rules alone — no data needed. */
export const DAY = {
  CLOSED: 'closed',      // structural: So (and Sa for multi-day). Never bookable, at any duration.
  PAST: 'past',          // before today, or today's remaining hours can no longer host the job.
  TOO_SOON: 'too_soon',  // multi-day cannot start today.
  UNKNOWN: 'unknown',    // not covered by loaded data, or covered only by a fallback skeleton.
  FULL: 'full',          // known, open, zero starts fit.
  FREE: 'free',          // known, open, ≥1 start.
};

/**
 * Status of one day for the whole booking (either shape).
 * @param duration  the result of computeBookingDuration()
 * @param avail     the result of makeAvailability()
 * @returns {{date, iso, status, freeCount, free:[{start,end}], plan, span}}
 */
export function dayStatus(date, duration, avail, now) {
  const iso = isoKey(date);
  if (duration.multiDay) {
    const status = multiDayStartState(date, duration.spanDays, avail, now);
    return {
      date, iso, status,
      freeCount: status === DAY.FREE ? 1 : 0,
      free: [], plan: null,
      span: status === DAY.FREE ? workingSpan(date, duration.spanDays) : null,
    };
  }
  const plan = sameDayPlan(date, duration.durationMin, avail.busy(date), now);
  let status;
  if (plan.closed) status = DAY.CLOSED;
  else if (plan.fullyPast) status = DAY.PAST;
  else if (plan.unknown) status = DAY.UNKNOWN;
  else if (plan.free.length > 0) status = DAY.FREE;
  // Today, and the clock alone rules it out: the earliest start we could still offer
  // (plan.past[1]) leaves less than the job needs before closing. Busy intervals are
  // irrelevant here — nothing would fit even on an empty day.
  else if (plan.past && plan.past[1] + duration.durationMin > plan.close) status = DAY.PAST;
  else status = DAY.FULL;
  return { date, iso, status, freeCount: plan.free.length, free: plan.free, plan, span: null };
}

/** Can a same-day job of `durMin` still be squeezed onto `date`? Coverage-aware. */
export function sameDayStartState(date, durMin, avail, now) {
  return dayStatus(date, { multiDay: false, durationMin: durMin, spanDays: null }, avail, now).status;
}

/** Does one day of a multi-day span have room for the car? Tolerates a short amount of existing
 *  busy time (see MULTIDAY_TOLERANCE_MIN) rather than demanding a totally empty day. `busy` is
 *  already clipped to working hours and merged, so summing the intervals is the day's booked total. */
function spanDayFree(busy) {
  const booked = busy.reduce((sum, [s, e]) => sum + (e - s), 0);
  return booked <= MULTIDAY_TOLERANCE_MIN;
}

/**
 * Status of `date` as a multi-day drop-off start: a future working day (not today) whose every
 * working span day is free of bookings.
 *
 * A definite FULL outranks UNKNOWN: if day 2 of the span is booked, the span is unbookable whether
 * or not day 3 was ever loaded. Only an otherwise-clean span with a gap in coverage is UNKNOWN.
 */
export function multiDayStartState(date, count, avail, now) {
  const base = startOfDay(date);
  const today0 = startOfDay(now);
  if (base < today0) return DAY.PAST;
  if (!isMultiDayDay(base)) return DAY.CLOSED;
  if (sameDay(base, today0)) return DAY.TOO_SOON;

  let unknown = false;
  for (const d of workingSpan(base, count)) {
    const busy = avail.busy(d);
    if (busy == null) { unknown = true; continue; }
    if (!spanDayFree(busy)) return DAY.FULL;
  }
  return unknown ? DAY.UNKNOWN : DAY.FREE;
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
 * Whether `date` is a valid multi-day drop-off start — i.e. we positively know the span is free.
 * UNKNOWN is not free, so a span reaching past the loaded range is refused, not offered.
 * @param avail  the result of makeAvailability()
 */
export function multiDayStartFree(date, count, avail, now) {
  return multiDayStartState(date, count, avail, now) === DAY.FREE;
}

// ── next-free scan ──────────────────────────────────────────────────────────
/**
 * Walk the horizon once from `fromDate` and collect the days that can be booked (in order). Used by
 * the week grid's "Nächster freier Termin" jump — it reads the first `kind:'day'` item. Stops at the
 * first UNKNOWN day: "the next free day" is an ordering claim, and a day we never fetched cannot be
 * ordered against — better to stop than to skip past a hole and call a later day "the next one".
 *
 * @returns {{
 *   items: Array<{kind:'day', date, iso, starts:[{start,end}], span:Date[]|null, freeCount:number}
 *              | {kind:'gap', from:Date, to:Date}>,
 *   count: number,            // number of bookable days found
 *   statuses: Map<iso,dayStatus>,
 *   truncated: boolean,       // hit an UNKNOWN day before the horizon end (ran out of data)
 *   exhausted: boolean,       // scanned the whole horizon with full knowledge, nothing free
 *   knownThrough: Date|null,  // last day we had data for
 *   until: Date,              // last day searched (inclusive) — for the honest empty-state copy
 * }}
 */
export function availableDays(fromDate, duration, avail, now, horizonDays = HORIZON_DAYS) {
  const start = startOfDay(fromDate);
  const items = [];
  const statuses = new Map();
  let count = 0;
  let truncated = false;
  let knownThrough = null;
  let sawFree = false;
  let gap = null;   // { from, to, hasNoFit } — a run of non-free days AFTER the first free day

  for (let i = 0; i < horizonDays; i++) {
    const date = addDays(start, i);
    const st = dayStatus(date, duration, avail, now);
    statuses.set(st.iso, st);

    if (st.status === DAY.UNKNOWN) { truncated = true; break; }
    knownThrough = date;

    if (st.status === DAY.FREE) {
      // Flush a pending gap, but only between two free days and only when it held a genuine
      // no-fit (a working day that is open but full). A run of just closed days — a weekend —
      // is not news and gets no marker.
      if (gap && gap.hasNoFit) items.push({ kind: 'gap', from: gap.from, to: gap.to });
      gap = null;
      items.push({ kind: 'day', date, iso: st.iso, starts: st.free, span: st.span, freeCount: st.freeCount });
      count++;
      sawFree = true;
    } else if (sawFree) {
      // Accumulate a gap only after the first free day, so a gap is never leading. A trailing gap
      // (after the last free day) is simply never flushed.
      if (!gap) gap = { from: date, to: date, hasNoFit: false };
      gap.to = date;
      if (st.status === DAY.FULL) gap.hasNoFit = true;
    }
  }

  const until = addDays(start, horizonDays - 1);
  return { items, count, statuses, truncated, exhausted: count === 0 && !truncated, knownThrough, until };
}
