const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/ugto7s564hkhy94gvh6ldgyjqgx7dn8x';

export async function fetchAvailability(dateString, signal) {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  const res = await fetch(
    `${API_BASE}/api/availability?date=${dateString}`,
    signal ? { signal } : undefined
  );
  if (!res.ok) throw new Error('Failed to fetch availability');
  return res.json();
}

export async function submitBooking(bookingData) {
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
  return { success: true };
}
