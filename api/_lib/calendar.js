import { google } from 'googleapis';

// ─── Auth ────────────────────────────────────────────────────────────────────

export function loadServiceAccountCredentials() {
  const raw = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '').trim();
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set');
  // Accept either the raw JSON or a base64-encoded JSON, so it works no matter
  // which form was pasted into the environment variable.
  const text = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  return JSON.parse(text);
}

function getAuthClient() {
  return new google.auth.GoogleAuth({
    credentials: loadServiceAccountCredentials(),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

// GOOGLE_CALENDAR_ID may be a single ID or a comma-separated list.
// All listed calendars are checked for busy times (so the owner's own calendar,
// where phone/walk-in appointments are entered, blocks website slots too).
// New bookings are written to the first (primary) calendar.
const CALENDAR_IDS = (process.env.GOOGLE_CALENDAR_ID || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
const PRIMARY_CALENDAR_ID = CALENDAR_IDS[0];

const TZ = 'Europe/Vienna';

// ─── Business hours (minutes from midnight). null = closed. ───────────────────
// Mo–Fr 08:00–18:00, Sa 08:00–13:00, So closed. Mirrors src/lib/scheduling.js.
export const WORKING_HOURS = {
  0: null,
  1: [480, 1080],
  2: [480, 1080],
  3: [480, 1080],
  4: [480, 1080],
  5: [480, 1080],
  6: [480, 780],
};
export const BUFFER = 30;
const DEFAULT_DURATION_MIN = 90;
const DROPOFF_MIN = 9 * 60;   // 09:00
const PICKUP_MIN = 16 * 60;   // 16:00

// ─── Timezone helpers (no external deps) ──────────────────────────────────────

// Minutes that Europe/Vienna is ahead of UTC at the given instant.
function tzOffsetMinutes(instant) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const m = {};
  for (const p of dtf.formatToParts(instant)) m[p.type] = p.value;
  const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
  return (asUTC - instant.getTime()) / 60000;
}

// Instant (Date) for a given Vienna wall-clock time on a calendar date.
function viennaInstant(dateString, hh, mm) {
  const [y, mo, d] = dateString.split('-').map(Number);
  const utcGuess = Date.UTC(y, mo - 1, d, hh, mm, 0);
  const off = tzOffsetMinutes(new Date(utcGuess));
  return new Date(utcGuess - off * 60000);
}

// Weekday (0=Sun..6=Sat) for a calendar date string, tz-independent.
function dayOfWeekFor(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function addDaysStr(dateString, n) {
  const [y, m, d] = dateString.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

function pad(n) { return String(n).padStart(2, '0'); }
function minToTime(min) { return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`; }

// Multi-day span as date strings — weekdays Mo–Fr only (Sat's 08–13 hours can't host a
// 09:00 drop-off → 16:00 pickup, so multi-day jobs run Mon–Fri). Mirrors workingSpan/isMultiDayDay
// in src/lib/scheduling.js.
function workingSpanStr(startDateString, count) {
  const out = [];
  let ds = startDateString;
  let guard = 0;
  while (out.length < count && guard < 60) {
    const dow = dayOfWeekFor(ds);
    if (dow >= 1 && dow <= 5) out.push(ds);
    ds = addDaysStr(ds, 1);
    guard++;
  }
  return out;
}

// ─── Availability (busy intervals) ────────────────────────────────────────────

// Bucket a set of busy instants into one day's working window, in minutes.
function busyMinutesForDay(dateString, busyInstants) {
  const wh = WORKING_HOURS[dayOfWeekFor(dateString)];
  if (!wh) return { date: dateString, closed: true, open: 480, close: 1080, busy: [] };
  const [open, close] = wh;
  const dayOpen = viennaInstant(dateString, Math.floor(open / 60), open % 60).getTime();
  const dayClose = viennaInstant(dateString, Math.floor(close / 60), close % 60).getTime();

  const busy = [];
  for (const b of busyInstants) {
    const s = Math.max(new Date(b.start).getTime(), dayOpen);
    const e = Math.min(new Date(b.end).getTime(), dayClose);
    if (s < e) {
      busy.push([
        open + Math.round((s - dayOpen) / 60000),
        open + Math.round((e - dayOpen) / 60000),
      ]);
    }
  }
  busy.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const iv of busy) {
    const last = merged[merged.length - 1];
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
    else merged.push([...iv]);
  }
  return { date: dateString, closed: false, open, close, busy: merged };
}

/**
 * Validate a free/busy response and flatten the busy instants across every requested calendar.
 *
 * Throws rather than returning partial data. Google returns, per calendar, EITHER `busy` OR an
 * `errors` array (notFound / forbidden / …). Reading only `.busy` degrades an unreachable calendar
 * to "no busy times" = completely free — which makes availability advertise every slot and makes
 * book.js's double-booking guard pass everything. A partial free/busy picture is worse than an
 * error, so callers get an error.
 *
 * An error-free entry with no `busy` key means "nothing booked", not a failure — Google omits
 * empty arrays. Throwing on that would flag every quiet day as an outage.
 *
 * NOTE: calendar IDs appear in the message. Both callers only console.error it and return a fixed
 * message (availability.js, book.js) — the text never reaches the client. Keep it that way.
 */
export function collectBusyInstants(calendars, ids) {
  if (!ids.length) throw new Error('GOOGLE_CALENDAR_ID is not set — no calendars to query');

  const cals = calendars || {};
  const problems = [];
  for (const id of ids) {
    const entry = cals[id];
    if (!entry) {
      problems.push(`${id}: missing from free/busy response`);
    } else if (entry.errors?.length) {
      problems.push(`${id}: ${entry.errors.map((e) => e.reason || 'unknown').join(', ')}`);
    }
  }
  if (problems.length) throw new Error(`Free/busy unavailable — ${problems.join('; ')}`);

  return ids.flatMap((id) => cals[id].busy || []);
}

/**
 * Busy intervals for `days` consecutive days from `startDateString`.
 * One free/busy call across all connected calendars.
 * @returns array of { date, closed, open, close, busy: [[startMin,endMin],…] }
 */
export async function getBusyForRange(startDateString, days) {
  // Fail before spending an auth + network round trip on a query that cannot answer anything.
  if (!CALENDAR_IDS.length) throw new Error('GOOGLE_CALENDAR_ID is not set — no calendars to query');

  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const timeMin = viennaInstant(startDateString, 0, 0).toISOString();
  const timeMax = viennaInstant(addDaysStr(startDateString, days), 0, 0).toISOString();

  const resp = await calendar.freebusy.query({
    requestBody: { timeMin, timeMax, timeZone: TZ, items: CALENDAR_IDS.map((id) => ({ id })) },
  });
  const busyInstants = collectBusyInstants(resp.data.calendars, CALENDAR_IDS);

  return Array.from({ length: days }, (_, i) => busyMinutesForDay(addDaysStr(startDateString, i), busyInstants));
}

export async function getBusyForDay(dateString) {
  const [day] = await getBusyForRange(dateString, 1);
  return day;
}

// ─── Overlap checks (server-side re-validation) ───────────────────────────────

/** Is the same-day interval [startMin,endMin] free on `dayBusy` (with buffer)? */
export function sameDayIntervalFree(dayBusy, startMin, endMin) {
  if (!dayBusy || dayBusy.closed) return false;
  if (startMin < dayBusy.open || endMin > dayBusy.close) return false;
  return !dayBusy.busy.some(([s, e]) => startMin < e + BUFFER && endMin > s - BUFFER);
}

/** Are all working days in the multi-day span free of any bookings? */
export async function multiDaySpanFree(startDateString, spanDays) {
  const span = workingSpanStr(startDateString, Math.ceil(spanDays));
  if (!span.length) return false;
  const last = span[span.length - 1];
  const totalDays = (new Date(`${last}T00:00:00Z`) - new Date(`${startDateString}T00:00:00Z`)) / 86400000 + 1;
  const range = await getBusyForRange(startDateString, totalDays);
  const byDate = Object.fromEntries(range.map((d) => [d.date, d]));
  return span.every((ds) => {
    const day = byDate[ds];
    return day && !day.closed && day.busy.length === 0;
  });
}

// ─── Create booking event ─────────────────────────────────────────────────────

export async function createBookingEvent({
  date, time, services, contact,
  serviceMode, location, vehicleCategory, vehicleAufpreis, mobileSurcharge, mobilePackageSurcharge, totalStr, photoUrls,
  durationMin, multiDay, spanDays,
}) {
  // Without this, events.insert is called with calendarId: undefined and fails opaquely.
  if (!PRIMARY_CALENDAR_ID) throw new Error('GOOGLE_CALENDAR_ID is not set — cannot write bookings');

  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const isMobile = serviceMode === 'mobil';
  const serviceList = services.map((s) => `  - ${s.name} (${s.price})`).join('\n');
  const vehicleLine = vehicleAufpreis ? `${vehicleCategory} (${vehicleAufpreis})` : vehicleCategory;
  const fallbackTotal = `ab €${services.reduce((sum, s) => sum + (s.priceNum || 0), 0).toLocaleString('de-AT')},-`;

  let startDateTime;
  let endDateTime;
  let scheduleLine;

  if (multiDay) {
    const span = workingSpanStr(date, Math.ceil(spanDays || 1));
    const first = span[0] || date;
    const last = span[span.length - 1] || date;
    startDateTime = `${first}T${minToTime(DROPOFF_MIN)}:00`;
    endDateTime = `${last}T${minToTime(PICKUP_MIN)}:00`;
    scheduleLine = isMobile
      ? `Zeitraum: Beginn ${first} ab ${minToTime(DROPOFF_MIN)} · Fertigstellung ${last} bis ${minToTime(PICKUP_MIN)}`
      : `Zeitraum: Abgabe ${first} bis ${minToTime(DROPOFF_MIN)} · Abholung ${last} ab ${minToTime(PICKUP_MIN)}`;
  } else {
    const dur = durationMin || DEFAULT_DURATION_MIN;
    const [h, m] = time.split(':').map(Number);
    const startMin = h * 60 + m;
    startDateTime = `${date}T${time}:00`;
    endDateTime = `${date}T${minToTime(startMin + dur)}:00`;
    scheduleLine = `Termin: ${time}–${minToTime(startMin + dur)} Uhr`;
  }

  const event = {
    summary: `${isMobile ? '[MOBIL] ' : ''}Aufbereitung: ${contact.name} — ${vehicleCategory}`,
    description: [
      `Service-Art: ${isMobile ? 'Mobiler Service' : 'Im Studio'}`,
      location ? `${isMobile ? 'Einsatzort' : 'Standort'}: ${location}` : null,
      scheduleLine,
      '',
      `Kunde: ${contact.name}`,
      `Telefon: ${contact.phone}`,
      `E-Mail: ${contact.email}`,
      `Fahrzeug: ${vehicleLine}`,
      '',
      'Services:',
      serviceList,
      isMobile && mobileSurcharge ? `  - Anfahrtspauschale (+€${mobileSurcharge},-)` : null,
      isMobile && mobilePackageSurcharge ? `  - Mobil-Aufpreis Paket (+€${mobilePackageSurcharge},-)` : null,
      '',
      `Geschätzte Summe: ${totalStr || fallbackTotal}`,
      contact.notes ? `\nAnmerkungen: ${contact.notes}` : null,
      photoUrls?.length ? `\nFahrzeugfotos:\n${photoUrls.join('\n')}` : null,
    ].filter((line) => line !== null).join('\n'),
    start: { dateTime: startDateTime, timeZone: TZ },
    end: { dateTime: endDateTime, timeZone: TZ },
    colorId: '2',
  };

  const result = await calendar.events.insert({
    calendarId: PRIMARY_CALENDAR_ID,
    requestBody: event,
  });

  return result.data;
}
