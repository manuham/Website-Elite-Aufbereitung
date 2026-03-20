const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function fetchAvailability(dateString) {
  const res = await fetch(`${API_BASE}/api/availability?date=${dateString}`);
  if (!res.ok) throw new Error('Failed to fetch availability');
  return res.json();
}

export async function submitBooking(bookingData) {
  const res = await fetch(`${API_BASE}/api/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Booking failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
