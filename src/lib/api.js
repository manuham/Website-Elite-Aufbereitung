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

export async function submitBooking(bookingData) {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  const res = await fetch(`${API_BASE}/api/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Booking failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
