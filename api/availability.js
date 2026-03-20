import { getAvailableSlots, BUSINESS_HOURS } from './_lib/calendar.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  const queryDate = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (queryDate < today) {
    return res.status(400).json({ error: 'Cannot query past dates.' });
  }

  const dayOfWeek = queryDate.getDay();
  if (!BUSINESS_HOURS[dayOfWeek]) {
    return res.status(200).json({ date, slots: [], closed: true });
  }

  try {
    const slots = await getAvailableSlots(date);
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
    return res.status(200).json({ date, slots, closed: false });
  } catch (error) {
    console.error('Calendar API error:', error);
    // Graceful degradation: return all hardcoded slots if Google API fails
    const fallbackSlots = BUSINESS_HOURS[dayOfWeek]?.slots || [];
    return res.status(200).json({ date, slots: fallbackSlots, closed: false, fallback: true });
  }
}
