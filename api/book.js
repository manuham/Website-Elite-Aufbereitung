import {
  createBookingEvent,
  getBusyForDay,
  sameDayIntervalFree,
  multiDaySpanFree,
} from './_lib/calendar.js';

const SLOT_TAKEN = {
  error: 'slot_taken',
  message: 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen Zeitpunkt.',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    date, time, services, contact,
    serviceMode, location, vehicleCategory, vehicleAufpreis, mobileSurcharge, mobilePackageSurcharge, totalStr, photoUrls,
    durationMin, multiDay, spanDays,
  } = req.body;

  const baseValid = date && services?.length && contact?.name && contact?.phone && contact?.email && vehicleCategory;
  const shapeValid = multiDay ? !!spanDays : (!!time && !!durationMin);
  if (!baseValid || !shapeValid) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    // Re-check availability to prevent double-booking (race guard).
    if (multiDay) {
      const free = await multiDaySpanFree(date, spanDays);
      if (!free) return res.status(409).json(SLOT_TAKEN);
    } else {
      const [h, m] = time.split(':').map(Number);
      const startMin = h * 60 + m;
      const dayBusy = await getBusyForDay(date);
      if (!sameDayIntervalFree(dayBusy, startMin, startMin + durationMin)) {
        return res.status(409).json(SLOT_TAKEN);
      }
    }

    const event = await createBookingEvent({
      date, time, services, contact,
      serviceMode, location, vehicleCategory, vehicleAufpreis, mobileSurcharge, mobilePackageSurcharge, totalStr, photoUrls,
      durationMin, multiDay, spanDays,
    });

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
