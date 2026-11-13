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
import {
  rebuildCart, dateAllowed, defangText, sizeForName, STUDIO_ADDRESSES,
} from './_lib/booking-rules.js';

const SLOT_TAKEN = {
  error: 'slot_taken',
  message: 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen Zeitpunkt.',
};
const INVALID = { error: 'Missing required fields.' };

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'ddtmjszd6';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'info.eliteaufbereitung@gmail.com';

// Build a validated, sanitised booking payload from the raw request body.
// Returns { ok: true, data } or { ok: false }.
//
// 2026-11-13 (security review E1/E6): the browser now chooses only WHICH services, WHICH vehicle
// class, WHEN, and the contact details. Duration, span, names, prices, surcharges and the total
// are rebuilt on the server from the service IDs (api/_lib/booking-rules.js, same data the page
// uses), and the date must lie inside the window the page offers. Free text is defanged.
export function validateBooking(body, now = new Date()) {
  if (!body || typeof body !== 'object') return { ok: false };

  const { date, time, services, contact, serviceMode, location, vehicleCategory, photoUrls, multiDay } = body;

  // ── shape ──
  if (!isIsoDate(date)) return { ok: false };
  const mode = serviceMode === 'mobil' ? 'mobil' : 'studio';

  // ── the cart, rebuilt from IDs (unknown id or vehicle class → refused) ──
  if (!Array.isArray(services)) return { ok: false };
  const cart = rebuildCart(services.map((s) => s?.id), vehicleCategory, mode);
  if (!cart.ok) return { ok: false };
  const d = cart.duration;

  // The page and the server compute the shape from the same data. A disagreement means a
  // stale page or a hand-made request — either way nothing is written.
  if ((multiDay === true) !== d.multiDay) return { ok: false };
  if (!d.multiDay && !isHmTime(time)) return { ok: false };
  if (!dateAllowed({ date, time, duration: d, items: cart.items }, now)) return { ok: false };

  // ── contact ──
  const name = defangText(cleanStr(contact?.name, 100));
  if (name.length < 2) return { ok: false };
  if (!isPhone(contact?.phone)) return { ok: false };
  if (!isEmail(String(contact?.email || '').trim())) return { ok: false };

  const address = defangText(cleanStr(contact?.address, 200));
  if (mode === 'mobil' && address.trim().length < 5) return { ok: false };

  // In the studio the location is one of the two studio addresses; mobil = the customer's address.
  const studio = cleanStr(location, 200);
  if (mode === 'studio' && !STUDIO_ADDRESSES.includes(studio)) return { ok: false };

  const cleanContact = {
    name,
    phone: cleanStr(contact?.phone, 40),
    email: cleanStr(contact?.email, 254),
    notes: defangText(cleanMultiline(contact?.notes, 1000)),
    address,
  };

  return {
    ok: true,
    data: {
      date,
      time: d.multiDay ? null : time,
      services: cart.lines,
      contact: cleanContact,
      serviceMode: mode,
      location: mode === 'mobil' ? address : studio,
      vehicleCategory: sizeForName(vehicleCategory).name,
      vehicleSizeFactor: cart.vehicleSizeFactor,
      mobileSurcharge: cart.anfahrt,
      mobilePackageSurcharge: cart.mobilPkg,
      totalStr: cart.totalStr,
      photoUrls: sanitizePhotoUrls(photoUrls, { cloudName: CLOUD_NAME, max: 4 }),
      durationMin: d.multiDay ? null : d.durationMin,
      multiDay: d.multiDay,
      spanDays: d.multiDay ? d.spanDays : null,
    },
  };
}

// Backup notification email (server-side, only after a validated, rate-limited booking
// succeeds). Awaited with a short timeout since 2026-11-13: un-awaited work after the response
// is not guaranteed to run on Vercel, so the mail could be lost silently. Never fails the booking.
async function sendNotificationEmail(event) {
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(NOTIFY_EMAIL)}`, {
      method: 'POST',
      signal: AbortSignal.timeout(4000),
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

    // Send the backup notification email server-side (awaited, 4 s cap, never throws).
    await sendNotificationEmail(event);

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
