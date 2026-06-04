/* ─── Elite Aufbereitung · Buchungskalender · data layer ─────────────────────
   Real services + durations + working hours. Two booking shapes:
     • same-day  (service.min)  → variable-height time blocks in the week grid
     • multi-day (service.days) → drop-off day + all-day span band
   Availability is deterministic mock (seeded) for the prototype. In production
   this is replaced by the live useAvailability hook — see handoff README.
--------------------------------------------------------------------------------*/
(function () {
  const DAYS_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const DAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  // Working hours (minutes from midnight). null = closed.
  const HOURS = {
    0: null,            // So
    1: [480, 1080],     // Mo  08:00–18:00
    2: [480, 1080],
    3: [480, 1080],
    4: [480, 1080],
    5: [480, 1080],
    6: [480, 780],      // Sa  08:00–13:00
  };
  const BUFFER = 30;            // min between two jobs
  const AXIS_START = 480;       // grid top 08:00
  const AXIS_END = 1080;        // grid bottom 18:00
  const DROPOFF_BY = '09:00';   // multi-day drop-off
  const PICKUP_FROM = '16:00';  // multi-day pickup on last day

  // ── Services (durations from client). min = same-day minutes; days = multi-day.
  const SERVICES = [
    { g: 'Komplettpakete', id: 'wash', name: 'Wash & Clean', min: 300, price: 'ab 230,–' },
    { g: 'Komplettpakete', id: 'deepclean', name: 'Deep Clean', days: 1, price: 'ab 390,–' },
    { g: 'Komplettpakete', id: 'deeppolish', name: 'Deep Polish', days: 2, price: 'ab 690,–' },
    { g: 'Komplettpakete', id: 'endstufe', name: 'Endstufe', days: 5, price: 'ab 1.790,–' },

    { g: 'Handwäsche', id: 'hw-basic', name: 'Handwäsche Basic', min: 60, price: 'ab 75,–' },
    { g: 'Handwäsche', id: 'hw-premium', name: 'Handwäsche Premium', min: 90, price: 'ab 115,–' },
    { g: 'Handwäsche', id: 'hw-pbi', name: 'Premium + Basic Innen', min: 150, price: 'ab 175,–' },

    { g: 'Innenraum', id: 'in-basic', name: 'Basic Innen', min: 90, price: 'ab 75,–' },
    { g: 'Innenraum', id: 'in-premium', name: 'Premium Innen', min: 150, price: 'ab 155,–' },
    { g: 'Innenraum', id: 'in-leder', name: 'Leder Beschichtung', min: 60, price: 'ab 85,–' },

    { g: 'Politur', id: 'pol-spot', name: 'Spot Politur', min: 60, price: 'ab 45,–' },
    { g: 'Politur', id: 'pol-leicht', name: 'Leichte Politur', min: 360, price: 'ab 395,–' },
    { g: 'Politur', id: 'pol-schwer', name: 'Schwere Politur', days: 1.5, price: 'ab 595,–' },
    { g: 'Politur', id: 'pol-schein', name: 'Scheinwerfer Politur', min: 180, price: 'ab 45,–' },

    { g: 'Zusatzleistungen', id: 'z-fenster', name: 'Autofenster', min: 120, price: 'ab 85,–' },
    { g: 'Zusatzleistungen', id: 'z-felgen', name: 'Felgen', min: 240, price: 'ab 85,–' },
    { g: 'Zusatzleistungen', id: 'z-ozon', name: 'Ozonbehandlung', min: 120, price: 'ab 75,–' },
    { g: 'Zusatzleistungen', id: 'z-verkauf', name: 'Verkaufsaufbereitung', min: 360, price: 'ab 295,–' },
    { g: 'Zusatzleistungen', id: 'z-pflege', name: 'Interieur Pflege', min: 60, price: 'ab 25,–' },

    { g: 'Beschichtungen', id: 'b-neu', name: 'Neuwagen Keramik', days: 2, price: 'ab 795,–' },
    { g: 'Beschichtungen', id: 'b-paket', name: 'Beschichtungspaket', days: 3, price: 'ab 895,–' },
    { g: 'Beschichtungen', id: 'b-matt', name: 'Matt-Beschichtung', days: 2, price: 'ab 795,–' },
    { g: 'Beschichtungen', id: 'b-kunst', name: 'Kunststoffteile beschichten', days: 1, price: 'auf Anfrage' },
  ];
  const isMultiDay = (s) => s && s.days != null;
  const spanDaysOf = (s) => Math.ceil(s.days);

  // ── date helpers ──
  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function ymd(d) { return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function isoKey(d) { const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return `${d.getFullYear()}-${m}-${day}`; }
  function minToTime(min) { const h = Math.floor(min / 60), m = min % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
  function timeToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
  function isWorkingDay(d) { return HOURS[d.getDay()] != null; }
  function rand(seed) { const x = Math.sin(seed) * 43758.5453; return x - Math.floor(x); }

  // duration label: "1 Std", "1,5 Std", "5 Std", "45 Min"
  function durLabel(min) {
    if (min < 60) return `${min} Min`;
    const h = min / 60;
    return (Number.isInteger(h) ? `${h}` : h.toString().replace('.', ',')) + ' Std';
  }
  function daysLabel(days) {
    return (Number.isInteger(days) ? `${days}` : days.toString().replace('.', ',')) + (days === 1 ? ' Tag' : ' Tage');
  }

  // Fixed "now" anchor for a stable prototype: Mon 8 Jun 2026, 10:42
  const NOW = new Date(2026, 5, 8, 10, 42, 0, 0);
  const TODAY = startOfDay(NOW);
  const NOW_MIN = NOW.getHours() * 60 + NOW.getMinutes();

  // ── seeded "existing bookings" (busy intervals) for a day ──
  function busyIntervals(date) {
    const wh = HOURS[date.getDay()];
    if (!wh) return [];
    const [open, close] = wh;
    const key = ymd(date);
    const r0 = rand(key * 0.137);
    const n = r0 < 0.30 ? 0 : r0 < 0.66 ? 1 : 2;
    const ivs = [];
    for (let i = 0; i < n; i++) {
      const rs = rand(key * 3.1 + i * 17.7);
      const rl = rand(key * 5.3 + i * 9.13);
      const len = 60 + Math.floor(rl * 5) * 30;          // 60–180 min
      const latest = close - len;
      if (latest <= open) continue;
      const start = open + Math.round(rs * ((latest - open) / 30)) * 30;
      ivs.push([start, start + len]);
    }
    ivs.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const iv of ivs) {
      const last = merged[merged.length - 1];
      if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
      else merged.push([...iv]);
    }
    return merged;
  }

  /* Same-day availability for a service of `dur` minutes.
     Returns { closed, open, close, busy:[[s,e]], past:[s,e]|null, free:[{start,end}] }
     Free blocks are packed back-to-back (with BUFFER), skipping busy + buffer.  */
  function sameDayPlan(date, dur) {
    const wh = HOURS[date.getDay()];
    if (!wh) return { closed: true, busy: [], free: [], past: null, open: AXIS_START, close: AXIS_END };
    const [open, close] = wh;
    const base = startOfDay(date);
    const isPast = base < TODAY;
    const isToday = sameDay(base, TODAY);

    const busy = busyIntervals(date);
    // earliest bookable cursor today = round NOW up to next 30 (+buffer)
    let earliest = open;
    if (isToday) earliest = Math.max(open, Math.ceil((NOW_MIN + BUFFER) / 30) * 30);
    let pastRegion = null;
    if (isToday && earliest > open) pastRegion = [open, Math.min(earliest, close)];

    if (isPast) return { closed: false, fullyPast: true, busy: [], free: [], past: [open, close], open, close };

    // blocked = busy expanded by buffer, clamped, merged
    const blocked = busy.map(([s, e]) => [Math.max(open, s - BUFFER), Math.min(close, e + BUFFER)]);
    blocked.sort((a, b) => a[0] - b[0]);
    const mb = [];
    for (const iv of blocked) { const last = mb[mb.length - 1]; if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]); else mb.push([...iv]); }

    // free gaps within [earliest, close]
    const free = [];
    let cursor = earliest;
    const gaps = [];
    for (const [bs, be] of mb) {
      if (bs > cursor) gaps.push([cursor, bs]);
      cursor = Math.max(cursor, be);
    }
    if (cursor < close) gaps.push([cursor, close]);

    for (const [gs, ge] of gaps) {
      let t = gs;
      while (t + dur <= ge) {
        free.push({ start: t, end: t + dur });
        t += dur + BUFFER;
      }
    }
    return { closed: false, busy, free, past: pastRegion, open, close };
  }

  // count of free same-day starts for a duration (for header / month dots)
  function freeStartCount(date, dur) {
    const p = sameDayPlan(date, dur);
    return p.closed || p.fullyPast ? 0 : p.free.length;
  }

  // ── multi-day: working-day span starting at `date` ──
  function workingSpan(date, count) {
    const out = [];
    let d = startOfDay(date);
    let guard = 0;
    while (out.length < count && guard < 60) { if (isWorkingDay(d)) out.push(new Date(d)); d = addDays(d, 1); guard++; }
    return out;
  }
  // seeded availability of a multi-day start
  function multiDayStartFree(date, count) {
    const base = startOfDay(date);
    if (base < TODAY || !isWorkingDay(base)) return false;
    if (sameDay(base, TODAY)) return false; // can't start a multi-day job same day
    const span = workingSpan(base, count);
    // every day in span must be "open" (seeded ~80% free)
    return span.every(d => rand(ymd(d) * 0.911) > 0.22);
  }

  function germanFull(d) { return `${DAYS_FULL[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`; }

  window.CAL = {
    DAYS_FULL, DAYS_SHORT, MONTHS,
    DAYS_MIN_MO: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    HOURS, BUFFER, AXIS_START, AXIS_END, DROPOFF_BY, PICKUP_FROM,
    SERVICES, isMultiDay, spanDaysOf,
    NOW, TODAY, NOW_MIN,
    startOfDay, ymd, addDays, sameDay, isoKey, minToTime, timeToMin, isWorkingDay, rand,
    durLabel, daysLabel, germanFull,
    busyIntervals, sameDayPlan, freeStartCount, workingSpan, multiDayStartFree,
  };
})();
