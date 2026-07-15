import { describe, it, expect, vi, afterEach } from 'vitest';

// src/lib/api.js reads import.meta.env.VITE_MAKE_WEBHOOK_URL into a module-scope const at
// import time, so the env must be stubbed before the module is loaded, not after.
async function loadApi({ makeUrl = '' } = {}) {
  vi.resetModules();
  vi.stubEnv('VITE_API_BASE', '');
  vi.stubEnv('VITE_MAKE_WEBHOOK_URL', makeUrl);
  return import('./api.js');
}

const res = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

// What api/book.js actually returns on a double-booking (its SLOT_TAKEN const).
const SLOT_TAKEN = {
  error: 'slot_taken',
  message: 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen Zeitpunkt.',
};

const booking = { date: '2026-07-20', time: '09:00', services: [] };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('submitBooking — the 409 slot-taken contract', () => {
  // The double-booking guard in api/book.js is only worth having if "slot taken" survives the
  // trip to the user. Falling back to Make.com on a 409 would re-introduce double-booking, and
  // losing err.data would silently downgrade the UX. Both are pinned here.

  it('does NOT fall back to Make.com on 409', async () => {
    const fetchMock = vi.fn(async () => res(409, SLOT_TAKEN));
    vi.stubGlobal('fetch', fetchMock);
    const { submitBooking } = await loadApi({ makeUrl: 'https://hook.example.com/abc' });

    await expect(submitBooking(booking)).rejects.toThrow();
    // Exactly one call = /api/book only. A second call would be the webhook.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/book');
  });

  it('throws an error carrying status 409 and data.error === "slot_taken"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => res(409, SLOT_TAKEN)));
    const { submitBooking } = await loadApi();

    // BookingPage.jsx:1347 checks BOTH fields:
    //   if (err.status === 409 && err.data?.error === 'slot_taken')
    // Preserving only `status` still avoids the Make fallback, but the user would get the
    // generic error instead of the slot-taken message and lose the bounce back to step 3.
    const err = await submitBooking(booking).catch((e) => e);
    expect(err.status).toBe(409);
    expect(err.data?.error).toBe('slot_taken');
    expect(err.message).toBe(SLOT_TAKEN.message);
  });
});

describe('submitBooking — the fallback boundary', () => {
  // Pins where the 409 exception ends and the Make fallback begins. Task 4 moves this line;
  // these tests are what make that refactor safe.

  it('a non-409 error DOES reach the Make fallback', async () => {
    const fetchMock = vi.fn(async (url) =>
      url === '/api/book' ? res(500, { error: 'booking_failed' }) : res(200, {})
    );
    vi.stubGlobal('fetch', fetchMock);
    const { submitBooking } = await loadApi({ makeUrl: 'https://hook.example.com/abc' });

    await expect(submitBooking(booking)).resolves.toEqual({ success: true, via: 'make' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('https://hook.example.com/abc');
  });

  it('an unreachable /api/book reaches the Make fallback', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === '/api/book') throw new TypeError('Failed to fetch');
      return res(200, {});
    });
    vi.stubGlobal('fetch', fetchMock);
    const { submitBooking } = await loadApi({ makeUrl: 'https://hook.example.com/abc' });

    await expect(submitBooking(booking)).resolves.toEqual({ success: true, via: 'make' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('with VITE_MAKE_WEBHOOK_URL unset (production today) the fallback is disabled', async () => {
    const fetchMock = vi.fn(async () => res(500, { error: 'booking_failed' }));
    vi.stubGlobal('fetch', fetchMock);
    const { submitBooking } = await loadApi({ makeUrl: '' });

    const err = await submitBooking(booking).catch((e) => e);
    expect(err.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no webhook call
  });

  it('a successful booking returns the API payload untouched', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => res(201, { success: true, eventId: 'evt_1' })));
    const { submitBooking } = await loadApi();

    await expect(submitBooking(booking)).resolves.toEqual({ success: true, eventId: 'evt_1' });
  });
});
