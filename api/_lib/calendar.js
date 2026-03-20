import { google } from 'googleapis';

// ─── Auth ────────────────────────────────────────────────────────────────────

function getAuthClient() {
  const keyJson = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString()
  );
  return new google.auth.GoogleAuth({
    credentials: keyJson,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

// ─── Business hours ──────────────────────────────────────────────────────────

export const BUSINESS_HOURS = {
  0: null, // Sunday — closed
  1: { slots: ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'] },
  2: { slots: ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'] },
  3: { slots: ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'] },
  4: { slots: ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'] },
  5: { slots: ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'] },
  6: { slots: ['08:00', '09:30', '11:00', '12:30'] }, // Saturday
};

const SLOT_DURATION_MINUTES = 90;

// ─── Availability ────────────────────────────────────────────────────────────

export async function getAvailableSlots(dateString) {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const date = new Date(dateString + 'T00:00:00');
  const dayOfWeek = date.getDay();
  const dayConfig = BUSINESS_HOURS[dayOfWeek];

  if (!dayConfig) return [];

  const freeBusyResponse = await calendar.freebusy.query({
    requestBody: {
      timeMin: `${dateString}T06:00:00`,
      timeMax: `${dateString}T20:00:00`,
      timeZone: 'Europe/Vienna',
      items: [{ id: CALENDAR_ID }],
    },
  });

  const busyPeriods = freeBusyResponse.data.calendars[CALENDAR_ID]?.busy || [];

  return dayConfig.slots.filter((slot) => {
    const [hours, minutes] = slot.split(':').map(Number);
    const slotStart = new Date(`${dateString}T${slot}:00`);
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60_000);

    return !busyPeriods.some((busy) => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  });
}

// ─── Create booking event ────────────────────────────────────────────────────

export async function createBookingEvent({ date, time, services, contact }) {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const startDateTime = `${date}T${time}:00`;
  const startMs = new Date(startDateTime).getTime();
  const endDateTime = new Date(startMs + SLOT_DURATION_MINUTES * 60_000).toISOString();

  const serviceList = services.map((s) => `  - ${s.name} (${s.price})`).join('\n');
  const total = services.reduce((sum, s) => sum + (s.priceNum || 0), 0);

  const event = {
    summary: `Aufbereitung: ${contact.name} — ${contact.vehicle}`,
    description: [
      `Kunde: ${contact.name}`,
      `Telefon: ${contact.phone}`,
      `E-Mail: ${contact.email}`,
      `Fahrzeug: ${contact.vehicle}`,
      '',
      'Services:',
      serviceList,
      '',
      `Geschätzte Summe: ab €${total.toLocaleString('de-AT')},-`,
      contact.notes ? `\nAnmerkungen: ${contact.notes}` : '',
    ].join('\n'),
    start: { dateTime: startDateTime, timeZone: 'Europe/Vienna' },
    end: { dateTime: endDateTime, timeZone: 'Europe/Vienna' },
    colorId: '2',
  };

  const result = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: event,
  });

  return result.data;
}
