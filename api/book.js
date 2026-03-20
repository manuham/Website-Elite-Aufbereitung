import { createBookingEvent, getAvailableSlots } from './_lib/calendar.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, time, services, contact } = req.body;

  if (!date || !time || !services?.length || !contact?.name || !contact?.phone || !contact?.email || !contact?.vehicle) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    // Re-check availability to prevent race conditions
    const available = await getAvailableSlots(date);
    if (!available.includes(time)) {
      return res.status(409).json({
        error: 'slot_taken',
        message: 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen Zeitpunkt.',
        availableSlots: available,
      });
    }

    const event = await createBookingEvent({ date, time, services, contact });

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
