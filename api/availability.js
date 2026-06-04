import { getBusyForRange, WORKING_HOURS } from './_lib/calendar.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function dayOfWeekFor(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function addDaysStr(dateString, n) {
  const [y, m, d] = dateString.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

// Day skeleton from the working-hours table only (no calendar data).
function fallbackDay(dateString) {
  const wh = WORKING_HOURS[dayOfWeekFor(dateString)];
  if (!wh) return { date: dateString, closed: true, open: 480, close: 1080, busy: [] };
  return { date: dateString, closed: false, open: wh[0], close: wh[1], busy: [] };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Accept either ?date=YYYY-MM-DD (single day) or ?start=YYYY-MM-DD&days=N (range).
  const start = req.query.start || req.query.date;
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 1, 1), 21);

  if (!start || !DATE_RE.test(start)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  try {
    const daysBusy = await getBusyForRange(start, days);
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
    return res.status(200).json({ start, days, daysBusy, fallback: false });
  } catch (error) {
    console.error('Calendar API error:', error);
    // Graceful degradation: working-hours skeleton, no busy data, flagged.
    const daysBusy = Array.from({ length: days }, (_, i) => fallbackDay(addDaysStr(start, i)));
    return res.status(200).json({ start, days, daysBusy, fallback: true });
  }
}
