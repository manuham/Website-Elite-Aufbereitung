import {
  createBookingEvent,
  getBusyForDay,
  sameDayIntervalFree,
  multiDaySpanFree,
} from './_lib/calendar.js';
import {
  applyCors,
  enforceRateLimit,
  isIsoDate,
  isHmTime,
  isEmail,
  isPhone,
  cleanStr,
  cleanMultiline,
  sanitizePhotoUrls,
} from './_lib/security.js';

const SLOT_TAKEN = {
  error: 'slot_taken',
  message: 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen Zeitpunkt.',
};
const INVALID = { error: 'Missing required fields.' };

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'ddtmjszd6';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'info.eliteaufbereitung@gmail.com';

function toNum(v, { min, max, fallback = 0 }) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// Build a validated, sanitised booking payload from the raw request body.
// Returns { ok: true, data } or { ok: false }.
function validateBooking(body) {
  if (!body || typeof body !== 'object') return { ok: false };

  const {
    date, time, services, contact, serviceMode, location,
    vehicleCategory, vehicleAufpreis, mobileSurcharge, mobilePackageSurcharge,
    totalStr, photoUrls, durationMin, multiDay, spanDays,
  } = body;

  // ── shape ──
  if (!isIsoDate(date)) return { ok: false };
  const isMulti = multiDay === true;
  if (isMulti) {
    if (!Number.isFinite(Number(spanDays)) || Number(spanDays) < 1 || Number(spanDays) > 30) return { ok: false };
  } else {
    if (!isHmTime(time)) return { ok: false };
    if (!Number.isFinite(Number(durationMin)) || Number(durationMin) < 1 || Number(durationMin) > 600) return { ok: false };
  }

  // ── services ──
  if (!Array.isArray(services) || services.length < 1 || services.length > 20) return { ok: false };
  const cleanServices = services.map((s) => ({
    id: cleanStr(s?.id, 80),
    name: cleanStr(s?.name, 120),
    price: cleanStr(s?.price, 40),
    priceNum: toNum(s?.priceNum, { min: 0, max: 100000, fallback: 0 }),
  }));
  if (cleanServices.some((s) => !s.name)) return { ok: false };

  // ── contact ──
  const name = cleanStr(contact?.name, 100);
  if (name.length < 2) return { ok: false };
  if (!isPhone(contact?.phone)) return { ok: false };
  if (!isEmail(String(contact?.email || '').trim())) return { ok: false };

  const mode = serviceMode === 'mobil' ? 'mobil' : 'studio';
  const address = cleanStr(contact?.address, 200);
  if (mode === 'mobil' && address.trim().length < 5) return { ok: false };

  const vehicle = cleanStr(vehicleCategory, 100);
  if (!vehicle) return { ok: false };

  const cleanContact = {
    name,
    phone: cleanStr(contact?.phone, 40),
    email: cleanStr(contact?.email, 254),
    notes: cleanMultiline(contact?.notes, 1000),
    address,
  };

  return {
    ok: true,
    data: {
      date,
      time: isMulti ? null : time,
      services: cleanServices,
      contact: cleanContact,
      serviceMode: mode,
      location: cleanStr(location, 200),
      vehicleCategory: vehicle,
      vehicleAufpreis: cleanStr(vehicleAufpreis, 60),
      mobileSurcharge: toNum(mobileSurcharge, { min: 0, max: 100000, fallback: 0 }),
      mobilePackageSurcharge: toNum(mobilePackageSurcharge, { min: 0, max: 100000, fallback: 0 }),
      totalStr: cleanStr(totalStr, 120),
      photoUrls: sanitizePhotoUrls(photoUrls, { cloudName: CLOUD_NAME, max: 4 }),
      durationMin: isMulti ? null : toNum(durationMin, { min: 1, max: 600, fallback: 90 }),
      multiDay: isMulti,
      spanDays: isMulti ? toNum(spanDays, { min: 1, max: 30, fallback: 1 }) : null,
    },
  };
}

// Fire-and-forget notification email (server-side, only after a validated,
// rate-limited booking succeeds). Never blocks or fails the booking response.
async function sendNotificationEmail(event) {
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(NOTIFY_EMAIL)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: event.summary || 'Neue Terminanfrage',
        _captcha: 'false',
        _template: 'box',
        message: event.description || '',
      }),
    });
  } catch (err) {
    console.error('Notification email error:', err);
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res, 'POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Abuse guard: bookings write to the owner's real calendar, so throttle hard.
  if (enforceRateLimit(req, res, { name: 'book', max: 8, windowMs: 60 * 60 * 1000 })) return;

  // Honeypot: legit browsers leave the hidden `website` field empty. Silently
  // accept (fake success) so bots don't learn the field is a trap — but create nothing.
  if (typeof req.body?.website === 'string' && req.body.website.trim() !== '') {
    return res.status(201).json({ success: true, message: 'Buchung erfolgreich erstellt.' });
  }

  const validated = validateBooking(req.body);
  if (!validated.ok) {
    return res.status(400).json(INVALID);
  }
  const b = validated.data;

  try {
    // Re-check availability to prevent double-booking (race guard).
    if (b.multiDay) {
      const free = await multiDaySpanFree(b.date, b.spanDays);
      if (!free) return res.status(409).json(SLOT_TAKEN);
    } else {
      const [h, m] = b.time.split(':').map(Number);
      const startMin = h * 60 + m;
      const dayBusy = await getBusyForDay(b.date);
      if (!sameDayIntervalFree(dayBusy, startMin, startMin + b.durationMin)) {
        return res.status(409).json(SLOT_TAKEN);
      }
    }

    const event = await createBookingEvent(b);

    // Send the backup notification email server-side (fire-and-forget).
    sendNotificationEmail(event);

    return res.status(201).json({
      success: true,
      eventId: event.id,
      message: 'Buchung erfolgreich erstellt.',
    });
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({
      error: 'booking_failed',
      message: 'Buchung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.',
    });
  }
}
