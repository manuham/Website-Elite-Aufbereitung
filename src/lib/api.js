export async function fetchAvailability(dateString, signal) {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  const res = await fetch(
    `${API_BASE}/api/availability?date=${dateString}`,
    signal ? { signal } : undefined
  );
  if (!res.ok) throw new Error('Failed to fetch availability');
  return res.json();
}

// Busy intervals for a whole week (or any range) in one call.
// Returns { start, days, daysBusy: [{date, closed, open, close, busy:[[startMin,endMin]]}], fallback }
export async function fetchAvailabilityRange(startString, days = 7, signal) {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  const res = await fetch(
    `${API_BASE}/api/availability?start=${startString}&days=${days}`,
    signal ? { signal } : undefined
  );
  if (!res.ok) throw new Error('Failed to fetch availability');
  return res.json();
}

// Fire-and-forget: send a question the FAQ bot couldn't answer to the server,
// which appends it to a Google Sheet for review (api/faq-log.js). Failures are
// silently ignored — the bot UX must never depend on this.
export function logUnansweredQuestion(q) {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  fetch(`${API_BASE}/api/faq-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q }),
  }).catch(() => {});
}

// Temporary fallback while the Google Calendar connection is being set up.
// Once GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_CALENDAR_ID are configured on the
// server, /api/book succeeds and this fallback is never used — no code change
// needed to switch over.
//
// SECURITY: a client-side webhook URL is inherently public (it ships in the
// bundle), so it cannot be kept secret. It is read from an env var here so it is
// not committed to source and can be rotated without a code change. The real
// remediation is to retire this fallback once /api/book is confirmed live, and to
// rotate + secure the Make scenario. If VITE_MAKE_WEBHOOK_URL is unset, the
// fallback is disabled (submitViaMake throws) rather than shipping a hard-coded URL.
const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL || '';

async function submitViaMake(bookingData) {
  if (!MAKE_WEBHOOK_URL) {
    const err = new Error('Booking failed');
    err.status = 503;
    err.data = {};
    throw err;
  }
  const res = await fetch(MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });
  if (!res.ok) {
    const err = new Error('Booking failed');
    err.status = res.status;
    err.data = {};
    throw err;
  }
  return { success: true, via: 'make' };
}

export async function submitBooking(bookingData) {
  const API_BASE = import.meta.env.VITE_API_BASE || '';

  let res;
  try {
    res = await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
  } catch {
    // API unreachable → keep bookings working via Make.com
    return submitViaMake(bookingData);
  }

  const data = await res.json().catch(() => ({}));

  // Booked successfully through the guarded endpoint.
  if (res.ok) return data;

  // Slot genuinely taken — do NOT fall back (that would re-introduce double-booking).
  if (res.status === 409) {
    const err = new Error(data.message || 'Slot taken');
    err.status = 409;
    err.data = data;
    throw err;
  }

  // Any other error (e.g. Google not connected yet → 500) → Make.com fallback.
  return submitViaMake(bookingData);
}
